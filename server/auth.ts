import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "tekstil-fabric-operations-secret",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: false, // Geliştirme ortamında false olmalı
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Oturum serializeUser:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Oturum deserializeUser başlıyor, id:", id);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.error(`Kullanıcı bulunamadı, id: ${id}`);
        return done(new Error(`Kullanıcı bulunamadı, id: ${id}`), null);
      }
      
      console.log(`Oturum deserializeUser başarılı, kullanıcı: ${user.id}, ${user.username}`);
      done(null, user);
    } catch (error) {
      console.error("Oturum deserializeUser sırasında hata:", error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Kullanıcı adı zaten kullanımda");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // If department is specified, assign the user to that department
      if (req.body.departmentId) {
        await storage.assignUserToDepartment(user.id, req.body.departmentId);
      }

      // If role is specified, assign the user to that role
      if (req.body.roleId) {
        await storage.assignRoleToUser(user.id, req.body.roleId);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login isteği alındı:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login sırasında hata:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Kimlik doğrulama başarısız:", info?.message || "Bilinmeyen hata");
        return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session başlatma hatası:", loginErr);
          return next(loginErr);
        }
        
        console.log("Kullanıcı başarıyla giriş yaptı:", user.id, user.username);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Yetkisiz istekte bulunan kullanıcı: Session yok veya geçersiz");
      return res.sendStatus(401);
    }
    console.log("Kullanıcı bilgileri gönderiliyor:", req.user.id, req.user.username);
    res.json(req.user);
  });

  // Get user permissions
  app.get("/api/user/permissions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const permissions = await storage.getUserPermissions(req.user.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Yetkiler alınırken bir hata oluştu" });
    }
  });

  // Get user roles
  app.get("/api/user/roles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const roles = await storage.getUserRoles(req.user.id);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Roller alınırken bir hata oluştu" });
    }
  });
}

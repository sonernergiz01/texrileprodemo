import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { db } from "../db";
import { eq } from "drizzle-orm";

export const yarnSpinningRouter = Router();

// Tüm iplik büküm siparişlerini getir
yarnSpinningRouter.get(
  "/twisting-orders",
  asyncHandler(async (req: Request, res: Response) => {
    const statusFilter = req.query.status as string | undefined;
    
    const filters: Record<string, any> = {};
    if (statusFilter) {
      filters.status = statusFilter;
    }
    
    const orders = await storage.getYarnTwistingOrders(filters);
    res.json(orders);
  })
);

// ID'ye göre iplik büküm siparişi getir
yarnSpinningRouter.get(
  "/twisting-orders/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz sipariş ID'si" });
    }
    
    const order = await storage.getYarnTwistingOrderById(id);
    
    if (!order) {
      return res.status(404).json({ error: "Büküm siparişi bulunamadı" });
    }
    
    res.json(order);
  })
);

// Yeni büküm siparişi oluştur
const createTwistingOrderSchema = z.object({
  productionStepId: z.number(),
  machineId: z.number(),
  yarnTypeId: z.number(),
  twistLevel: z.string().optional(),
  yarnCount: z.string(),
  twistDirection: z.enum(["S", "Z"]),
  twistAmount: z.number(),
  quantity: z.number(),
  assignedOperatorId: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

yarnSpinningRouter.post(
  "/twisting-orders",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedData = createTwistingOrderSchema.parse(req.body);
      
      const newOrder = await storage.createYarnTwistingOrder({
        ...validatedData,
        status: "planned",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      throw error;
    }
  })
);

// Büküm siparişini güncelle
const updateTwistingOrderSchema = z.object({
  productionStepId: z.number().optional(),
  machineId: z.number().optional(),
  yarnTypeId: z.number().optional(),
  twistLevel: z.string().optional().nullable(),
  yarnCount: z.string().optional(),
  twistDirection: z.enum(["S", "Z"]).optional(),
  twistAmount: z.number().optional(),
  quantity: z.number().optional(),
  assignedOperatorId: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional(),
});

yarnSpinningRouter.patch(
  "/twisting-orders/:id",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Geçersiz sipariş ID'si" });
      }
      
      const validatedData = updateTwistingOrderSchema.parse(req.body);
      
      const updatedOrder = await storage.updateYarnTwistingOrder(id, validatedData);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: "Büküm siparişi bulunamadı" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      throw error;
    }
  })
);

// Büküm siparişi durumunu güncelle
yarnSpinningRouter.patch(
  "/twisting-orders/:id/status",
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz sipariş ID'si" });
    }
    
    if (!status || !["planned", "in-progress", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Geçersiz durum değeri" });
    }
    
    const updatedOrder = await storage.updateYarnTwistingOrderStatus(id, status);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: "Büküm siparişi bulunamadı" });
    }
    
    res.json(updatedOrder);
  })
);

// Departmana göre makineleri getir
yarnSpinningRouter.get(
  "/machines",
  asyncHandler(async (req: Request, res: Response) => {
    const departmentId = parseInt(req.query.departmentId as string);
    
    if (isNaN(departmentId)) {
      return res.status(400).json({ error: "Geçersiz departman ID'si" });
    }
    
    const machines = await storage.getMachinesByDepartment(departmentId);
    res.json(machines);
  })
);

// Proses tipine göre üretim adımlarını getir
yarnSpinningRouter.get(
  "/production-steps",
  asyncHandler(async (req: Request, res: Response) => {
    const processTypeId = parseInt(req.query.processTypeId as string);
    
    if (isNaN(processTypeId)) {
      return res.status(400).json({ error: "Geçersiz proses tipi ID'si" });
    }
    
    const steps = await storage.getProductionStepsByProcessType(processTypeId);
    res.json(steps);
  })
);
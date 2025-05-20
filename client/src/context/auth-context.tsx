import { createContext } from "react";
import {
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, LoginData, RegisterData } from "@shared/schema";

export type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
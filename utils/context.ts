import { createContext, Dispatch, SetStateAction, useState } from "react";

function noopSetter() { };

export type AuthContextType = [AuthState, AuthSetter];
export type AuthState = Record<string, any>;
type AuthSetter = Dispatch<SetStateAction<AuthState>>;

export const AuthContext = createContext<AuthContextType>([{}, noopSetter]);
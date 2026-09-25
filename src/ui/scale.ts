import { createContext, useContext } from 'react'

/** The game is laid out at a fixed virtual resolution and scaled uniformly to fit the window. */
export const BASE_W = 1440
export const BASE_H = 900

export const ScaleContext = createContext(1)
export const useScale = () => useContext(ScaleContext)

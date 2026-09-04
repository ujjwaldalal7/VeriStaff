import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Theme = "light" | "dark";

interface ThemeState {
  mode: Theme;
}

const getInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem("veristaff_theme");

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "light";
};

const initialState: ThemeState = {
  mode: getInitialTheme()
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.mode = action.payload;

      localStorage.setItem(
        "veristaff_theme",
        action.payload
      );
    },

    toggleTheme: (state) => {
      state.mode = state.mode === "light"
        ? "dark"
        : "light";

      localStorage.setItem(
        "veristaff_theme",
        state.mode
      );
    }
  }
});

export const {
  setTheme,
  toggleTheme
} = themeSlice.actions;

export default themeSlice.reducer;
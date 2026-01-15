# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

---

## 🚀 Flujo de Usuario

### Pantalla Inicial
La aplicación comienza en la **Landing Page** (`/`) que presenta:
- Logo y descripción de Sirona
- Collage visual de los 4 roles del sistema
- Botones de "Iniciar sesión" y "Registrarse"

Los usuarios no autenticados son dirigidos a la Landing Page. Después del login exitoso, son redirigidos a `/inicio`.

---

## 🎨 Design System - Role Based Color Themes

Sirona utiliza un sistema de temas por rol de usuario. Cada rol tiene un color primario asociado que se usa en botones, badges, y elementos interactivos.

### Paleta de Colores por Rol

| Rol | Color | Código Hex | Descripción |
|-----|-------|-----------|------------|
| **Médico** | Violeta Pastel | `#7B69C9` | Color primario principal. Representa profesionalismo y confianza. |
| **Paciente** | Teal Profundo | `#2a9d8f` | Accesible y amigable. Representa seguridad y bienestar. |
| **Secretario** | Salmón/Coral | `#D8735A` | Cálido y acogedor. Representa organización y apoyo. |
| **Administrador** | Azul Oscuro | `#4D85A8` | Serio y formal. Representa autoridad y control. |

### Implementación

En futuras actualizaciones, los colores se asignarán dinámicamente basados en el rol del usuario autenticado:

```tsx
// Ejemplo (próxima implementación)
const roleColorMap = {
  'Médico': '#7B69C9',
  'Paciente': '#2a9d8f',
  'Secretario': '#D8735A',
  'Administrador': '#4D85A8'
};

const userThemeColor = roleColorMap[user.role];
```

Actualmente, el sistema usa `primary` (#7B69C9), `secondary` (#2a9d8f), `tertiary` (#D8735A) y `quaternary` (#4D85A8) definidos en `src/styles/tokens/_colors.scss`.

---

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

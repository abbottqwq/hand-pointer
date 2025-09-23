# Tailwind Utility Function (tw)

This project uses a custom `tw` utility function that combines `clsx` and `tailwind-merge` for better class name management.

## What it does

- **clsx**: Allows conditional class names using objects, arrays, and boolean conditions
- **tailwind-merge**: Intelligently merges Tailwind classes, removing conflicts and duplicates

## Usage Examples

### Basic Usage

```tsx
import { tw } from "../utils/tw";

// Simple class combination
<div className={tw("bg-red-500", "text-white", "p-4")} />;
```

### Conditional Classes

```tsx
// Using boolean conditions
<button
  className={tw(
    "px-4 py-2 rounded",
    "bg-blue-500 hover:bg-blue-600",
    isActive && "ring-2 ring-blue-300",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
/>

// Using objects for conditions
<div
  className={tw("base-class", {
    "bg-green-500": isSuccess,
    "bg-red-500": isError,
    "bg-gray-500": isNeutral
  })}
/>
```

### Class Conflict Resolution

```tsx
// Without tw: "p-4 p-6" would result in both classes
// With tw: automatically resolves to "p-6" (last one wins)
<div className={tw("p-4", "p-6")} /> // Result: "p-6"

// More complex example
<div className={tw(
  "bg-red-500 bg-blue-500",  // Resolves to: bg-blue-500
  "text-sm text-lg",         // Resolves to: text-lg
  "m-2 mx-4"                 // Resolves to: my-2 mx-4
)} />
```

### Array Support

```tsx
const baseClasses = ["flex", "items-center"];
const conditionalClasses = isLarge ? ["text-xl", "p-6"] : ["text-sm", "p-2"];

<div className={tw(baseClasses, conditionalClasses)} />;
```

## Benefits

1. **Type Safety**: Full TypeScript support with proper autocompletion
2. **Conflict Resolution**: Automatically handles Tailwind class conflicts
3. **Conditional Logic**: Clean syntax for conditional classes
4. **Performance**: Optimized class string generation
5. **Maintainability**: Easier to read and modify complex class combinations

## Original CSS Reference

The original CSS files are kept in the project for reference:

- `src/components/CameraControls.css` - Original camera controls styles
- `src/App.css` - Original app-level styles

These show the equivalent CSS that has been converted to Tailwind classes using the `tw` function.

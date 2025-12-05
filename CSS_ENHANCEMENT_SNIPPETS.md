# 🎨 CSS Enhancement Snippets - Copy & Customize

## Design System Variables

```css
:root {
    /* Brand Colors */
    --primary: #c41e3a;           /* Main red */
    --primary-light: #e74856;     /* Lighter red */
    --primary-dark: #8b1629;      /* Darker red */
    --secondary: #006241;          /* Green accent */
    --secondary-light: #00875d;   /* Lighter green */
    --accent: #f39200;             /* Gold */
    --success: #10b981;            /* Success green */
    --error: #ef4444;              /* Error red */
    --warning: #f59e0b;            /* Warning amber */
    
    /* Neutrals */
    --dark: #1a1a1a;               /* Pure dark */
    --light: #fafafa;              /* Off white */
    --gray-50: #f9fafb;            /* Very light */
    --gray-100: #f3f4f6;           /* Light */
    --gray-200: #e5e7eb;           /* Light gray */
    --gray-300: #d1d5db;           /* Gray */
    --gray-400: #9ca3af;           /* Medium gray */
    --gray-600: #4b5563;           /* Dark gray */
    
    /* Spacing Scale */
    --sp-xs: 4px;
    --sp-sm: 8px;
    --sp-md: 12px;
    --sp-lg: 16px;
    --sp-xl: 24px;
    --sp-2xl: 32px;
    --sp-3xl: 48px;
    
    /* Shadow Depths */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.15);
    --shadow-2xl: 0 20px 40px rgba(0, 0, 0, 0.2);
    
    /* Border Radius */
    --radius-sm: 6px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    
    /* Transitions */
    --trans-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --trans-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    --trans-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 🎨 Gradient Text (Logo Style)

```css
.logo-text {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
    letter-spacing: -0.5px;
}
```

**Result:** Red-to-green gradient text effect

---

## ✨ Shimmer Effect (Button Hover)

```css
.btn {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
}

.btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s ease;
}

.btn:hover::before {
    left: 100%;
}
```

**Result:** Shimmer light moves across button on hover

---

## 💫 Focus Glow (Form Input)

```css
input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
    transition: var(--trans-fast);
}
```

**Result:** Red glow ring around focused input

---

## 🪄 Elevation Effect (Card Hover)

```css
.card {
    transition: var(--trans-base);
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(0,0,0,0.05);
}

.card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary);
}
```

**Result:** Card elevates and shadow deepens on hover

---

## 🎬 Fade-In Animation

```css
@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.element {
    animation: fadeInDown 0.8s ease-out;
}
```

**Result:** Element slides down while fading in

---

## 🌊 Floating Animation

```css
@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
}

.element {
    animation: float 3s ease-in-out infinite;
}
```

**Result:** Gentle up-and-down floating motion

---

## 📊 Gradient Background Card

```css
.card {
    background: linear-gradient(135deg, white 0%, #fafafa 100%);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(0,0,0,0.05);
}
```

**Result:** Subtle gradient card background

---

## 🎯 Scale-In Animation

```css
@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.element {
    animation: scaleIn 0.4s ease-out;
}
```

**Result:** Element grows in while fading in

---

## 📍 Slide-In Animation

```css
@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.element {
    animation: slideInRight 0.4s ease-out;
}
```

**Result:** Element slides in from right

---

## 🔘 Modern Button

```css
.btn-primary {
    padding: 16px 32px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: var(--trans-base);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.btn-primary:active {
    transform: translateY(0);
}
```

**Result:** Professional gradient button with depth

---

## 🎨 Modal Dialog

```css
.modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: linear-gradient(135deg, white 0%, #fafafa 100%);
    border-radius: var(--radius-xl);
    padding: 32px;
    max-width: 560px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    animation: modalSlideIn 0.4s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
```

**Result:** Modern modal with animation

---

## 🏷️ Badge/Label

```css
.badge {
    display: inline-block;
    padding: 6px 12px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
```

**Result:** Professional gradient badge

---

## 📋 Tab Navigation

```css
.tab {
    padding: 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-weight: 600;
    color: var(--gray-400);
    border-bottom: 3px solid transparent;
    transition: var(--trans-fast);
}

.tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
}

.tab:hover {
    color: var(--gray-600);
}
```

**Result:** Modern tab navigation

---

## 🎓 Accessibility Improvements

```css
/* High contrast focus states */
:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

/* Better color contrast */
.text-secondary {
    color: var(--gray-600);  /* Better than #999 */
}

/* Readable font sizes */
body {
    font-size: 16px;  /* Minimum for accessibility */
    line-height: 1.6;
}

/* Sufficient click target */
button {
    min-height: 44px;  /* Touch-friendly */
    min-width: 44px;
}
```

**Result:** WCAG AAA compliant design

---

## 🚀 Quick Copy-Paste Templates

### Button Template
```css
.btn {
    padding: var(--sp-lg);
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: var(--trans-base);
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}
```

### Card Template
```css
.card {
    background: linear-gradient(135deg, white 0%, #fafafa 100%);
    border-radius: var(--radius-xl);
    padding: var(--sp-xl);
    box-shadow: var(--shadow-md);
    border: 1px solid rgba(0,0,0,0.05);
    transition: var(--trans-base);
}

.card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
}
```

### Form Input Template
```css
input {
    padding: 12px 16px;
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-md);
    font-size: 15px;
    transition: var(--trans-fast);
}

input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
}
```

---

## 🎯 Usage Tips

1. **Use CSS Variables**: Always use `var(--primary)` instead of hardcoding `#c41e3a`
2. **Consistent Timing**: Use `--trans-base` (250ms) for most interactions
3. **Shadow Hierarchy**: Use `--shadow-sm` at rest, `--shadow-lg` on hover
4. **Animations**: Keep animations under 500ms for better UX
5. **Performance**: Use `transform` and `opacity` for smooth 60fps animations

---

## 📚 Resources Used

- CSS Variables for theming
- CSS Gradients (modern syntax)
- CSS Animations with @keyframes
- CSS Transitions
- Backdrop Filters
- Transform properties (GPU accelerated)

**All modern, browser-supported, no dependencies!** 🚀

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                // Brand-guide aligned. DHL "Delivery" is a proprietary
                // typeface — fallback to Inter + system Helvetica chain.
                sans:    ['Inter', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
                display: ['Inter', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
                mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
            },
            colors: {
                dhl: {
                    yellow: '#FFCC00',
                    'yellow-dark': '#E6B800',
                    red: '#D40511',
                    'red-dark': '#B3040E',
                    ink: '#1A1A1A',
                    text: '#333333',
                    muted: '#666666',
                    panel: '#F5F5F5',
                    border: '#E5E7EB',
                    // Sustainability-only — used for carbon emissions, eco modes
                    green: '#006B3F',
                    'green-light': '#E1F1E8',
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'dash-flow': {
                    'to': { 'stroke-dashoffset': '-30' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-up': 'fade-up 0.6s ease-out both',
                'dash-flow': 'dash-flow 1.8s linear infinite'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};

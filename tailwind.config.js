/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#234ED8',
                'primary-hover': '#1a3db0',
                secondary: '#00C42A',
                dark: '#212121',
                surface: '#2a2a2a',
                'surface-2': '#333333',
                border: '#3a3a3a',
                muted: '#888888',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['"Jersey 25"', 'cursive'],
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
        },
    },
    plugins: [],
}

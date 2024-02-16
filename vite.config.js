import { resolve } from 'path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// Set to this to the name of this collection of components
// This must match node-red-dashboard-2.widgets[libraryName] in package.json
const LIBRARY_NAME = 'ui-svg'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), cssInjectedByJsPlugin()],
    build: {
        // Skip minification in dev mode
        minify: process.env.NODE_ENV !== 'development',

        // Configure build as a UMD library
        lib: {
            entry: resolve(__dirname, 'ui/index.js'),
            name: LIBRARY_NAME,
            formats: ['umd'],
            fileName: (format, entryName) => `${LIBRARY_NAME}.${format}.js`
        },

        // Utilise Node-RED's handling of /resources folder for the build output
        outDir: './resources',

        // Declare dependencies that shouldn't be bundled into the library
        rollupOptions: {
            // Don't rollup the Vue dependency into the build
            external: ['vue', 'vuex'],
            output: {
                // Provide global variables to use in the UMD build
                globals: {
                    vue: 'Vue',
                    vuex: 'vuex'
                }
            }
        }
    }
})

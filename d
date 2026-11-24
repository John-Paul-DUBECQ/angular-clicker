warning: in the working copy of 'angular.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'package.json', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/angular.json b/angular.json[m
[1mindex a4803c1..b41620b 100644[m
[1m--- a/angular.json[m
[1m+++ b/angular.json[m
[36m@@ -22,7 +22,6 @@[m
             "main": "src/main.ts",[m
             "polyfills": "src/polyfills.ts",[m
             "tsConfig": "tsconfig.app.json",[m
[31m-            "aot": true,[m
             "assets": [[m
               "src/favicon.ico",[m
               "src/assets"[m
[36m@@ -34,7 +33,13 @@[m
             ],[m
             "scripts": [[m
               "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"[m
[31m-            ][m
[32m+[m[32m            ],[m
[32m+[m[32m            "vendorChunk": true,[m
[32m+[m[32m            "extractLicenses": false,[m
[32m+[m[32m            "buildOptimizer": false,[m
[32m+[m[32m            "sourceMap": true,[m
[32m+[m[32m            "optimization": false,[m
[32m+[m[32m            "namedChunks": true[m
           },[m
           "configurations": {[m
             "production": {[m
[36m@@ -64,7 +69,8 @@[m
                 }[m
               ][m
             }[m
[31m-          }[m
[32m+[m[32m          },[m
[32m+[m[32m          "defaultConfiguration": ""[m
         },[m
         "serve": {[m
           "builder": "@angular-devkit/build-angular:dev-server",[m
[1mdiff --git a/package-lock.json b/package-lock.json[m
[1mindex a48f607..e7efb72 100644[m
[1m--- a/package-lock.json[m
[1m+++ b/package-lock.json[m
[36m@@ -4,257 +4,279 @@[m
   "lockfileVersion": 1,[m
   "requires": true,[m
   "dependencies": {[m
[31m-    "@angular-devkit/architect": {[m
[31m-      "version": "0.1102.11",[m
[31m-      "resolved": "https://registry.npmjs.org/@angular-devkit/architect/-/architect-0.1102.11.tgz",[m
[31m-      "integrity": "sha512-1MoUSz7zNJomUUuzbIyBSprzbWa9eF97SRDEbllYHHXY/IWWetHGNK7gkJPyW0zgKhXIc5Sq4TJKIJKWPNh00Q==",[m
[32m+[m[32m    "@ampproject/remapping": {[m
[32m+[m[32m      "version": "1.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@ampproject/remapping/-/remapping-1.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-Ta9bMA3EtUHDaZJXqUoT5cn/EecwOp+SXpKJqxDbDuMbLvEMu6YTyDDuvTWeStODfdmXyfMo7LymQyPkN3BicA==",[m
       "dev": true,[m
       "requires": {[m
[31m-        "@angular-devkit/core": "11.2.11",[m
[31m-        "rxjs": "6.6.3"[m
[32m+[m[32m        "@jridgewell/resolve-uri": "1.0.0",[m
[32m+[m[32m        "sourcemap-codec": "1.4.8"[m
       },[m
       "dependencies": {[m
[31m-        "rxjs": {[m
[31m-          "version": "6.6.3",[m
[31m-          "resolved": "https://registry.npmjs.org/rxjs/-/rxjs-6.6.3.tgz",[m
[31m-          "integrity": "sha512-trsQc+xYYXZ3urjOiJOuCOa5N3jAZ3eiSpQB5hIT8zGlL2QfnHLJ2r7GMkBGuIausdJN1OneaI6gQlsqNHHmZQ==",[m
[31m-          "dev": true,[m
[31m-          "requires": {[m
[31m-            "tslib": "^1.9.0"[m
[31m-          }[m
[31m-        },[m
[31m-        "tslib": {[m
[31m-          "version": "1.14.1",[m
[31m-          "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",[m
[31m-          "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",[m
[32m+[m[32m        "@jridgewell/resolve-uri": {[m
[32m+[m[32m          "version": "1.0.0",[m
[32m+[m[32m          "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-1.0.0.tgz",[m
[32m+[m[32m          "integrity": "sha512-9oLAnygRMi8Q5QkYEU4XWK04B+nuoXoxjRvRxgjuChkLZFBja0YPSgdZ7dZtwhncLBcQe/I/E+fLuk5qxcYVJA==",[m
           "dev": true[m
         }[m
       }[m
     },[m
[32m+[m[32m    "@angular-devkit/architect": {[m
[32m+[m[32m      "version": "0.1202.18",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@angular-devkit/architect/-/architect-0.1202.18.tgz",[m
[32m+[m[32m      "integrity": "sha512-C4ASKe+xBjl91MJyHDLt3z7ICPF9FU6B0CeJ1phwrlSHK9lmFG99WGxEj/Tc82+vHyPhajqS5XJ38KyVAPBGzA==",[m
[32m+[m[32m      "dev": true,[m
[32m+[m[32m      "requires": {[m
[32m+[m[32m        "@angular-devkit/core": "12.2.18",[m
[32m+[m[32m        "rxjs": "6.6.7"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "@angular-devkit/build-angular": {[m
[31m-      "version": "0.1102.11",[m
[31m-      "resolved": "https://registry.npmjs.org/@angular-devkit/build-angular/-/build-angular-0.1102.11.tgz",[m
[31m-      "integrity": "sha512-oT4eiVs4va5rKE1dsbi9C2kDzTVzLx9PNPGtTiClG5uRPMWGyljXtHNMfDy0gH9H5kjcObwR/a8EPrx7Xd3ZAA==",[m
[31m-      "dev": true,[m
[31m-      "requires": {[m
[31m-        "@angular-devkit/architect": "0.1102.11",[m
[31m-        "@angular-devkit/build-optimizer": "0.1102.11",[m
[31m-        "@angular-devkit/build-webpack": "0.1102.11",[m
[31m-        "@angular-devkit/core": "11.2.11",[m
[31m-        "@babel/core": "7.12.10",[m
[31m-        "@babel/generator": "7.12.11",[m
[31m-        "@babel/plugin-transform-async-to-generator": "7.12.1",[m
[31m-        "@babel/plugin-transform-runtime": "7.12.10",[m
[31m-        "@babel/preset-env": "7.12.11",[m
[31m-        "@babel/runtime": "7.12.5",[m
[31m-        "@babel/template": "7.12.7",[m
[31m-        "@discoveryjs/json-ext": "0.5.2",[m
[32m+[m[32m      "version": "12.2.18",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@angular-devkit/build-angular/-/build-angular-12.2.18.tgz",[m
[32m+[m[32m      "integrity": "sha512-Hf3s7etN7zkHc7lhZZx3Bsm6hfLozuvN3z2aI39RDSlHOA83SoYpltnD9UV4B4d3cxU4PLUzpirb96QeS+E53Q==",[m
[32m+[m[32m      "dev": true,[m
[32m+[m[32m      "requires": {[m
[32m+[m[32m        "@ampproject/remapping": "1.0.1",[m
[32m+[m[32m        "@angular-devkit/architect": "0.1202.18",[m
[32m+[m[32m        "@angular-devkit/build-optimizer": "0.1202.18",[m
[32m+[m[32m        "@angular-devkit/build-webpack": "0.1202.18",[m
[32m+[m[32m        "@angular-devkit/core": "12.2.18",[m
[32m+[m[32m        "@babel/core": "7.14.8",[m
[32m+[m[32m        "@babel/generator": "7.14.8",[m
[32m+[m[32m        "@babel/helper-annotate-as-pure": "7.14.5",[m
[32m+[m[32m        "@babel/plugin-proposal-async-generator-functions": "7.14.7",[m
[32m+[m[32m        "@babel/plugin-transform-async-to-generator": "7.14.5",[m
[32m+[m[32m        "@babel/plugin-transform-runtime": "7.14.5",[m
[32m+[m[32m        "@babel/preset-env": "7.14.8",[m
[32m+[m[32m        "@babel/runtime": "7.14.8",[m
[32m+[m[32m        "@babel/template": "7.14.5",[m
[32m+[m[32m        "@discoveryjs/json-ext": "0.5.3",[m
         "@jsdevtools/coverage-istanbul-loader": "3.0.5",[m
[31m-        "@ngtools/webpack": "11.2.11",[m
[32m+[m[32m        "@ngtools/webpack": "12.2.18",[m
         "ansi-colors": "4.1.1",[m
[31m-        "autoprefixer": "10.2.4",[m
         "babel-loader": "8.2.2",[m
         "browserslist": "^4.9.1",[m
[31m-        "cacache": "15.0.5",[m
[32m+[m[32m        "cacache": "15.2.0",[m
         "caniuse-lite": "^1.0.30001032",[m
         "circular-dependency-plugin": "5.2.2",[m
[31m-        "copy-webpack-plugin": "6.3.2",[m
[31m-        "core-js": "3.8.3",[m
[31m-        "critters": "0.0.7",[m
[31m-        "css-loader": "5.0.1",[m
[31m-        "cssnano": "5.0.1",[m
[31m-        "file-loader": "6.2.0",[m
[32m+[m[32m        "copy-webpack-plugin": "9.0.1",[m
[32m+[m[32m        "core-js": "3.16.0",[m
[32m+[m[32m        "critters": "0.0.12",[m
[32m+[m[32m        "css-loader": "6.2.0",[m
[32m+[m[32m        "css-minimizer-webpack-plugin": "3.0.2",[m
[32m+[m[32m        "esbuild": "0.13.8",[m
[32m+[m[32m        "esbuild-wasm": "0.13.8",[m
         "find-cache-dir": "3.3.1",[m
[31m-        "glob": "7.1.6",[m
[32m+[m[32m        "glob": "7.1.7",[m
         "https-proxy-agent": "5.0.0",[m
[31m-        "inquirer": "7.3.3",[m
[31m-        "jest-worker": "26.6.2",[m
[32m+[m[32m        "inquirer": "8.1.2",[m
         "karma-source-map-support": "1.4.0",[m
         "less": "4.1.1",[m
[31m-        "less-loader": "7.3.0",[m
[31m-        "license-webpack-plugin": "2.3.11",[m
[32m+[m[32m        "less-loader": "10.0.1",[m
[32m+[m[32m        "license-webpack-plugin": "2.3.20",[m
         "loader-utils": "2.0.0",[m
[31m-        "mini-css-extract-plugin": "1.3.5",[m
[32m+[m[32m        "mini-css-extract-plugin": "2.4.2",[m
         "minimatch": "3.0.4",[m
[31m-        "open": "7.4.0",[m
[31m-        "ora": "5.3.0",[m
[32m+[m[32m        "open": "8.2.1",[m
[32m+[m[32m        "ora": "5.4.1",[m
         "parse5-html-rewriting-stream": "6.0.1",[m
[31m-        "pnp-webpack-plugin": "1.6.4",[m
[31m-        "postcss": "8.2.13",[m
[31m-        "postcss-import": "14.0.0",[m
[31m-        "postcss-loader": "4.2.0",[m
[31m-        "raw-loader": "4.0.2",[m
[31m-        "regenerator-runtime": "0.13.7",[m
[31m-        "resolve-url-loader": "3.1.2",[m
[31m-        "rimraf": "3.0.2",[m
[31m-        "rollup": "2.38.4",[m
[31m-        "rxjs": "6.6.3",[m
[31m-        "sass": "1.32.6",[m
[31m-        "sass-loader": "10.1.1",[m
[31m-        "semver": "7.3.4",[m
[31m-        "source-map": "0.7.3",[m
[31m-        "source-map-loader": "1.1.3",[m
[32m+[m[32m        "piscina": "3.1.0",[m
[32m+[m[32m        "postcss": "8.3.6",[m
[32m+[m[32m        "postcss-import": "14.0.2",[m
[32m+[m[32m        "postcss-loader": "6.1.1",[m
[32m+[m[32m        "postcss-preset-env": "6.7.0",[m
[32m+[m[32m        "regenerator-runtime": "0.13.9",[m
[32m+[m[32m        "resolve-url-loader": "4.0.0",[m
[32m+[m[32m        "rxjs": "6.6.7",[m
[32m+[m[32m        "sass": "1.36.0",[m
[32m+[m[32m        "sass-loader": "12.1.0",[m
[32m+[m[32m        "semver": "7.3.5",[m
[32m+[m[32m        "source-map-loader": "3.0.0",[m
         "source-map-support": "0.5.19",[m
[31m-        "speed-measure-webpack-plugin": "1.4.2",[m
[31m-        "style-loader": "2.0.0",[m
[32m+[m[32m        "style-loader": "3.2.1",[m
         "stylus": "0.54.8",[m
[31m-        "stylus-loader": "4.3.3",[m
[31m-        "terser": "5.5.1",[m
[31m-        "terser-webpack-plugin": "4.2.3",[m
[32m+[m[32m        "stylus-loader": "6.1.0",[m
[32m+[m[32m        "terser": "5.14.2",[m
[32m+[m[32m        "terser-webpack-plugin": "5.1.4",[m
         "text-table": "0.2.0",[m
         "tree-kill": "1.2.2",[m
[31m-        "webpack": "4.44.2",[m
[31m-        "webpack-dev-middleware": "3.7.2",[m
[31m-        "webpack-dev-server": "3.11.2",[m
[31m-        "webpack-merge": "5.7.3",[m
[31m-        "webpack-sources": "2.2.0",[m
[31m-        "webpack-subresource-integrity": "1.5.2",[m
[31m-        "worker-plugin": "5.0.0"[m
[31m-      },[m
[31m-      "dependencies": {[m
[31m-        "rxjs": {[m
[31m-          "version": "6.6.3",[m
[31m-          "resolved": "https://registry.npmjs.org/rxjs/-/rxjs-6.6.3.tgz",[m
[31m-          "integrity": "sha512-trsQc+xYYXZ3urjOiJOuCOa5N3jAZ3eiSpQB5hIT8zGlL2QfnHLJ2r7GMkBGuIausdJN1OneaI6gQlsqNHHmZQ==",[m
[32m+[m[32m        "tslib": "2.3.0",[m
[32m+[m[32m        "webpack": "5.50.0",[m
[32m+[m[32m        "webpack-dev-middleware": "5.0.0",[m
[32m+[m[32m        "webpack-dev-server": "3.11.3",[m
[32m+[m[32m        "webpack-merge": "5.8.0",[m
[32m+[m[32m        "webpack-subresource-integrity": "1.5.2"[m
[32m+[m[32m      },[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@babel/core": {[m
[32m+[m[32m          "version": "7.14.8",[m
[32m+[m[32m          "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.14.8.tgz",[m
[32m+[m[32m          "integrity": "sha512-/AtaeEhT6ErpDhInbXmjHcUQXH0L0TEgscfcxk1qbOvLuKCa5aZT0SOOtDKFY96/CLROwbLSKyFor6idgNaU4Q==",[m
[32m+[m[32m          "dev": true,[m
[32m+[m[32m          "requires": {[m
[32m+[m[32m            "@babel/code-frame": "^7.14.5",[m
[32m+[m[32m            "@babel/generator": "^7.14.8",[m
[32m+[m[32m            "@babel/helper-compilation-targets": "^7.14.5",[m
[32m+[m[32m            "@babel/helper-module-transforms": "^7.14.8",[m
[32m+[m[32m            "@babel/helpers": "^7.14.8",[m
[32m+[m[32m            "@babel/parser": "^7.14.8",[m
[32m+[m[32m            "@babel/template": "^7.14.5",[m
[32m+[m[32m            "@babel/traverse": "^7.14.8",[m
[32m+[m[32m            "@babel/types": "^7.14.8",[m
[32m+[m[32m            "convert-source-map": "^1.7.0",[m
[32m+[m[32m            "debug": "^4.1.0",[m
[32m+[m[32m            "gensync": "^1.0.0-beta.2",[m
[32m+[m[32m            "json5": "^2.1.2",[m
[32m+[m[32m            "semver": "^6.3.0",[m
[32m+[m[32m            "source-map": "^0.5.0"[m
[32m+[m[32m          },[m
[32m+[m[32m          "dependencies": {[m
[32m+[m[32m            "semver": {[m
[32m+[m[32m              "version": "6.3.2",[m
[32m+[m[32m              "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.2.tgz",[m
[32m+[m[32m              "integrity": "sha512-GYrCADwpu6yV5OAvchkQ27Z5wwMxWAEMg5NNWjyHh/5DboFFqbdbvYNIvZouQpxXyeMPoTOh0vdPYKlf0ZswdQ==",[m
[32m+[m[32m              "dev": true[m
[32m+[m[32m            }[m
[32m+[m[32m          }[m
[32m+[m[32m        },[m
[32m+[m[32m        "@babel/generator": {[m
[32m+[m[32m          "version": "7.14.8",[m
[32m+[m[32m          "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.14.8.tgz",[m
[32m+[m[32m          "integrity": "sha512-cYDUpvIzhBVnMzRoY1fkSEhK/HmwEVwlyULYgn/tMQYd6Obag3ylCjONle3gdErfXBW61SVTlR9QR7uWlgeIkg==",[m
[32m+[m[32m          "dev": true,[m
[32m+[m[32m          "requires": {[m
[32m+[m[32m            "@babel/types": "^7.14.8",[m
[32m+[m[32m            "jsesc": "^2.5.1",[m
[32m+[m[32m            "source-map": "^0.5.0"[m
[32m+[m[32m          }[m
[32m+[m[32m        },[m
[32m+[m[32m        "@babel/template": {[m
[32m+[m[32m          "version": "7.14.5",[m
[32m+[m[32m          "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.14.5.tgz",[m
[32m+[m[32m          "integrity": "sha512-6Z3Po85sfxRGachLULUhOmvAaOo7xCvqGQtxINai2mEGPFm6pQ4z5QInFnUrRpfoSV60BnjyF5F3c+15fxFV1g==",[m
[32m+[m[32m          "dev": true,[m
[32m+[m[32m          "requires": {[m
[32m+[m[32m            "@babel/code-frame": "^7.14.5",[m
[32m+[m[32m            "@babel/parser": "^7.14.5",[m
[32m+[m[32m            "@babel/types": "^7.14.5"[m
[32m+[m[32m          }[m
[32m+[m[32m        },[m
[32m+[m[32m        "esbuild-wasm": {[m
[32m+[m[32m          "version": "0.13.8",[m
[32m+[m[32m          "resolved": "https://registry.npmjs.org/esbuild-wasm/-/esbuild-wasm-0.13.8.tgz",[m
[32m+[m[32m          "integrity": "sha512-UbD+3nloiSpJWXTCInZQrqPe8Y+RLfDkY/5kEHiXsw/lmaEvibe69qTzQu16m5R9je/0bF7VYQ5jaEOq0z9lLA==",[m
[32m+[m[32m          "dev": true[m
[32m+[m[32m        },[m
[32m+[m[32m        "glob": {[m
[32m+[m[32m          "version": "7.1.7",[m
[32m+[m[32m          "resolved": "https://registry.npmjs.org/glob/-/glob-7.1.7.tgz",[m
[32m+[m[32m          "integrity": "sha512-OvD9ENzPLbegENnYP5UUfJIirTg4+XwMWGaQfQTY0JenxNvvIKP3U3/tAQSPIu/lHxXYSZmpXlUHeqAIdKzBLQ==",[m
           "dev": true,[m
           "requires": {[m
[31m-            "tslib": "^1.9.0"[m
[32m+[m[32m            "fs.realpath": "^1.0.0",[m
[32m+[m[32m            "inflight": "^1.0.4",[m
[32m+[m[32m            "inherits": "2",[m
[32m+[m[32m            "minimatch": "^3.0.4",[m
[32m+[m[32m            "once": "^1.3.0",[m
[32m+[m[32m            "path-is-absolute": "^1.0.0"[m
           }[m
         },[m
[32m+[m[32m        "source-map": {[m
[32m+[m[32m          "version": "0.5.7",[m
[32m+[m[32m          "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.5.7.tgz",[m
[32m+[m[32m          "integrity": "sha512-LbrmJOMUSdEVxIKvdcJzQC+nQhe8FUZQTXQy6+I75skNgn3OoQ0DZA8YnFa7gp8tqtL3KPf1kmo0R5DoApeSGQ==",[m
[32m+[m[32m          "dev": true[m
[32m+[m[32m        },[m

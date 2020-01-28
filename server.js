const express = require('express');
const {keystone, apps, distDir} = require('./index.js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
process.env.BLOG_ENV = 'production'
// process.env.NODE_ENV = 'production'

keystone
    .prepare({apps, dev: process.env.NODE_ENV !== 'production', distDir})
    .then(async ({middlewares}) => {
        await keystone.connect();
        const app = express();
        if (process.env.BLOG_ENV === 'production') {
            middlewares.unshift(function (req, res, next) {
                if (req.secure) {
                    // request was via https, so do no special handling
                    next();
                } else {
                    // request was via http, so redirect to https
                    res.redirect('https://' + req.headers.host + req.url);
                }
            });
            const options = {
                cert: fs.readFileSync(path.join('live', 'sheldon.ink-0001/cert.pem'), 'utf8'),
                ca: fs.readFileSync(path.join('live', 'sheldon.ink-0001/fullchain.pem'), 'utf8'),
                key: fs.readFileSync(path.join('live', 'sheldon.ink-0001/privkey.pem'), 'utf8')
            };

            http.createServer(app.use(middlewares)).listen(80)
            https.createServer(options, app.use(middlewares)).listen(443)
        } else {
            app.use(middlewares).listen(80);
        }
    });

/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as functions from 'firebase-functions';
import vision from "@google-cloud/vision";

import config from "./config";

const admin = require('firebase-admin');
admin.initializeApp();

const client = new vision.ImageAnnotatorClient();

exports.extractText = functions.storage.object().onFinalize(async (object) => {
    const bucket = admin.storage().bucket(object.bucket);
    const imageContents = await bucket.file(object.name).download();
    const imageBase64 = Buffer.from(imageContents[0]).toString("base64");
    const request = {
        "image": {
            "content": imageBase64,
        },
        "features": [
            {
                "type": "TEXT_DETECTION",
            },
        ],
    };
    const results = await client.annotateImage(request);
    const extractedText = results?.[0]?.textAnnotations?.[0]?.description;
    await bucket.file(object.name + config.textFileSuffix).save(extractedText);
});
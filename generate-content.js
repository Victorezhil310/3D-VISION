const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const MODELS_DIR = path.join(DATA_DIR, 'models');
const BLOG_DIR = path.join(DATA_DIR, 'blog');
const CATEGORIES_DIR = path.join(DATA_DIR, 'categories');

[DATA_DIR, MODELS_DIR, BLOG_DIR, CATEGORIES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 1. Generate 20 Categories
const categories = [
    "Space", "Solar System", "Earth", "Human Anatomy", "Animals", "Cars", "Bikes", 
    "Aircraft", "Ships", "Architecture", "Electronics", "Computer Parts", "Physics", 
    "Chemistry", "Biology", "Engineering", "Mathematics", "History", "Art", "Gaming Assets"
];

const categoryData = categories.map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    description: `Explore highly detailed 3D models and educational content about ${name}.`
}));

fs.writeFileSync(path.join(CATEGORIES_DIR, 'index.json'), JSON.stringify(categoryData, null, 2));

// 2. Generate 100 Models
const models = [];
for (let i = 1; i <= 100; i++) {
    const category = categoryData[i % categoryData.length];
    const model = {
        id: `model-${i}`,
        title: `${category.name} Model ${i}`,
        categoryId: category.id,
        description: `This is a high-fidelity educational 3D model representing ${category.name}. Use our interactive viewer to zoom, pan, and learn.`,
        specifications: {
            "Polygons": Math.floor(Math.random() * 50000) + 10000,
            "Materials": "PBR 4K",
            "Animated": i % 3 === 0
        },
        educationalInfo: `Learn about the intricate details of ${category.name}. This model demonstrates the core principles of its structure and function.`,
        facts: [
            `This model uses a photorealistic PBR workflow.`,
            `It is optimized for WebGL viewing.`,
            `Real-world scaling is applied.`
        ],
        downloads: Math.floor(Math.random() * 1000)
    };
    models.push(model);
    fs.writeFileSync(path.join(MODELS_DIR, `${model.id}.json`), JSON.stringify(model, null, 2));
}
fs.writeFileSync(path.join(MODELS_DIR, 'index.json'), JSON.stringify(models, null, 2));

// 3. Generate 50 Blog Articles
for (let i = 1; i <= 50; i++) {
    const slug = `educational-article-${i}`;
    const content = `---
title: "Educational Article ${i}"
date: "2026-08-07"
author: "3D Vision Education Team"
---

# Introduction to Article ${i}

Welcome to this educational article. Here we will explore the fascinating world of 3D modeling and its applications in science, education, and engineering.

## The Core Concepts

Understanding these principles allows us to interact with digital worlds in a meaningful way.

- Interactive Learning
- Spatial Reasoning
- High-fidelity visualization

## Conclusion

Thank you for reading this guide on 3D Vision.
`;
    fs.writeFileSync(path.join(BLOG_DIR, `${slug}.md`), content);
}

console.log("Successfully generated 100 models, 50 blog posts, and 20 categories!");

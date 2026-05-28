require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const FAQ = require('../models/FAQ');
const Category = require('../models/Category');
const Activity = require('../models/Activity');
const Chat = require('../models/Chat');
const SearchFailure = require('../models/SearchFailure');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database (enhanced)...');

    await Promise.all([
      User.deleteMany({}), FAQ.deleteMany({}), Category.deleteMany({}),
      Activity.deleteMany({}), Chat.deleteMany({}), SearchFailure.deleteMany({}),
    ]);

    // Categories
    const categories = await Category.insertMany([
      { name: 'AI/ML', description: 'Artificial Intelligence and Machine Learning', icon: '🤖', faqCount: 0 },
      { name: 'Programming', description: 'Coding languages and development', icon: '💻', faqCount: 0 },
      { name: 'Finance', description: 'Financial topics and investment', icon: '💰', faqCount: 0 },
      { name: 'Education', description: 'Learning and academic topics', icon: '🎓', faqCount: 0 },
      { name: 'Healthcare', description: 'Health and medical information', icon: '🏥', faqCount: 0 },
      { name: 'Cloud/DevOps', description: 'Cloud infrastructure and DevOps', icon: '☁️', faqCount: 0 },
      { name: 'Design', description: 'UI/UX and product design', icon: '🎨', faqCount: 0 },
      { name: 'General', description: 'General knowledge and miscellaneous', icon: '🌐', faqCount: 0 },
    ]);

    const passwordHash = await bcrypt.hash('password123', 12);

    // Users with XP
    const admin = await User.create({ name: 'Alex Rivera', email: 'admin@crowd.faq', password: passwordHash, role: 'admin', xp: 3420 });
    const alice = await User.create({ name: 'Alice Chen', email: 'jane@example.com', password: passwordHash, role: 'user', xp: 2180 });
    const bob = await User.create({ name: 'Bob Kumar', email: 'demo@crowd.faq', password: passwordHash, role: 'user', xp: 1850 });
    const carol = await User.create({ name: 'Carol Singh', email: 'carol@example.com', password: passwordHash, role: 'user', xp: 1620 });
    const david = await User.create({ name: 'David Park', email: 'david@example.com', password: passwordHash, role: 'user', xp: 1340 });
    const eva = await User.create({ name: 'Eva Müller', email: 'eva@example.com', password: passwordHash, role: 'user', xp: 980 });

    const users = [admin, alice, bob, carol, david, eva];

    // FAQs with realistic data
    const faqData = [
      { question: 'What is the difference between supervised and unsupervised learning?', answer: 'Supervised learning uses labeled data where the correct answer is known during training. The algorithm learns to map inputs to outputs. Unsupervised learning works with unlabeled data and discovers hidden patterns or groupings without predefined labels. Examples: supervised = classification/regression; unsupervised = clustering/dimensionality reduction.', category: 'AI/ML', tags: ['machine learning', 'supervised', 'unsupervised', 'AI'], votes: 142, views: 1840, user: admin._id, isAI: true, createdAt: new Date('2026-05-20') },
      { question: 'How do I train a CNN model from scratch?', answer: 'To train a CNN from scratch: 1) Collect and label your dataset 2) Preprocess images (resize, normalize) 3) Build CNN architecture (Conv2D, MaxPooling, Dense layers) 4) Compile with optimizer (Adam/SGD), loss function (categorical_crossentropy) 5) Train with model.fit() using validation split 6) Evaluate on test set 7) Fine-tune with data augmentation if needed. Use TensorFlow/Keras or PyTorch.', category: 'AI/ML', tags: ['CNN', 'deep learning', 'neural network', 'image classification'], votes: 98, views: 2100, user: alice._id, isAI: true, createdAt: new Date('2026-05-21') },
      { question: 'What is the best programming language for beginners?', answer: 'Python is widely considered the best starter language due to its simple, readable syntax that mirrors natural language. It has vast libraries, strong community support, and works across web development, data science, AI, automation, and more. Other good options: JavaScript (for web), Java (for Android/cross-platform), or C (for fundamentals). Start with Python if unsure.', category: 'Programming', tags: ['python', 'beginners', 'programming language'], votes: 203, views: 5400, user: admin._id, createdAt: new Date('2026-05-18') },
      { question: 'How do I protect my API keys in a React app?', answer: 'Never embed API keys directly in frontend code. Best practices: 1) Use environment variables (.env files) with VITE_ prefix for Vite 2) Proxy API calls through your own backend server 3) Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) 4) Implement rate limiting and CORS 5) Rotate keys regularly 6) Use separate keys per environment (dev/staging/prod).', category: 'Programming', tags: ['react', 'security', 'API keys', 'environment variables'], votes: 167, views: 3200, user: alice._id, createdAt: new Date('2026-05-22') },
      { question: 'What is the 50/30/20 budget rule?', answer: 'The 50/30/20 rule is a budgeting framework: 50% of income goes to NEEDS (rent, utilities, groceries, insurance), 30% to WANTS (entertainment, dining out, hobbies), and 20% to SAVINGS/DEBT (emergency fund, retirement contributions, debt repayment). This simple framework helps balance spending while building financial security. Adjust ratios based on income and location.', category: 'Finance', tags: ['budgeting', 'personal finance', 'savings'], votes: 89, views: 1650, user: bob._id, createdAt: new Date('2026-05-19') },
      { question: 'How does compound interest work?', answer: 'Compound interest earns interest on both your initial principal and previously earned interest. Formula: A = P(1 + r/n)^(nt). Example: $1,000 at 5% annual interest compounds to $1,276 after 5 years with annual compounding. The key advantage: time. $1,000 invested at age 25 becomes ~$7,040 by 65, vs ~$3,390 if started at 35.', category: 'Finance', tags: ['compound interest', 'investing', 'savings'], votes: 112, views: 1980, user: carol._id, createdAt: new Date('2026-05-23') },
      { question: 'What are the best free resources to learn Data Science?', answer: 'Top free resources: 1) Kaggle (datasets, competitions, micro-courses) 2) Fast.ai (practical deep learning course) 3) Google ML Crash Course 4) Khan Academy (statistics) 5) MIT OpenCourseWare (math/CS) 6) YouTube: 3Blue1Brown (math), Sentdex (Python), StatQuest (statistics) 7) GitHub open-source projects. Practice is key — work on real projects.', category: 'Education', tags: ['data science', 'learning', 'free resources'], votes: 134, views: 2890, user: admin._id, isAI: true, createdAt: new Date('2026-05-24') },
      { question: 'How does health insurance work in the USA?', answer: 'US health insurance works through premiums (monthly payments), deductibles (amount paid before coverage starts), copays (fixed per-visit fees), and coinsurance (percentage split after deductible). Types: HMO (network-only, referrals required), PPO (flexible, higher cost), EPO (mid-range). Marketplace plans via healthcare.gov. Employer plans often subsidize premiums.', category: 'Healthcare', tags: ['health insurance', 'USA', 'healthcare system'], votes: 76, views: 1420, user: david._id, createdAt: new Date('2026-05-20') },
      { question: 'How do I set up CI/CD with GitHub Actions?', answer: 'To set up CI/CD with GitHub Actions: 1) Create .github/workflows directory in your repo 2) Add a YAML file (e.g., ci.yml) 3) Define triggers (push, pull_request) 4) Set up jobs with steps (checkout, setup, install, test, deploy) 5) Add secrets via repo Settings > Secrets 6) Monitor runs in Actions tab. Example: Node.js project needs actions/checkout, actions/setup-node, npm install, npm test.', category: 'Cloud/DevOps', tags: ['CI/CD', 'GitHub Actions', 'DevOps', 'automation'], votes: 58, views: 980, user: bob._id, createdAt: new Date('2026-05-25') },
      { question: 'What is Docker and when should I use it?', answer: 'Docker packages applications and their dependencies into containers — lightweight, portable, and consistent across environments. Use Docker when: 1) You want consistent dev/prod parity 2) Microservices architecture 3) Scaling services independently 4) Simplifying complex dependency setups. Core concepts: Dockerfile (image recipe), Image (template), Container (running instance), Docker Hub (registry).', category: 'Cloud/DevOps', tags: ['docker', 'containers', 'devops', 'deployment'], votes: 91, views: 2100, user: alice._id, createdAt: new Date('2026-05-21') },
      { question: 'How do I design a good REST API?', answer: 'REST API best practices: 1) Use nouns not verbs (/users not /getUsers) 2) Proper HTTP methods (GET=read, POST=create, PUT=update, DELETE=delete) 3) Use plural nouns (/users not /user) 4) Nest resources logically (/users/123/posts) 5) Return appropriate status codes (200, 201, 400, 401, 403, 404, 500) 6) Support pagination (?page=1&limit=20) 7) Version your API (/v1/users) 8) Use JSON consistently.', category: 'Programming', tags: ['REST API', 'backend', 'design patterns'], votes: 145, views: 3200, user: carol._id, createdAt: new Date('2026-05-22') },
      { question: 'What is Retrieval-Augmented Generation (RAG)?', answer: 'RAG combines a retriever (finds relevant docs) with a generator (LLM produces answer). Workflow: 1) User query embedded via vector model 2) Top-k relevant docs retrieved from vector DB 3) Retrieved context + query sent to LLM 4) LLM generates answer using both query and retrieved context. Benefits: reduces hallucinations, provides up-to-date knowledge, allows source citation. Stack: vector DB (Pinecone/Milvus) + LLM (OpenAI/Gemini).', category: 'AI/ML', tags: ['RAG', 'LLM', 'vector database', 'AI'], votes: 88, views: 1560, user: admin._id, isAI: true, createdAt: new Date('2026-05-26') },
      { question: 'What are Figma components and variants?', answer: 'Figma components are reusable design elements. Variants let you create multiple states/versions of a component in one frame. Best practices: 1) Name components clearly (Button/Primary, Button/Secondary) 2) Use Auto Layout for responsive components 3) Use variables for design tokens (colors, spacing) 4) Leverage component properties (text, icon, boolean) 5) Use overrides to customize instances without affecting the master.', category: 'Design', tags: ['figma', 'UI design', 'components', 'design system'], votes: 62, views: 1100, user: eva._id, createdAt: new Date('2026-05-23') },
      { question: 'How do I reduce Lambda cold start latency?', answer: 'Lambda cold starts can be reduced by: 1) Use Provisioned Concurrency (keeps instances warm — costs more) 2) Minimize package size (smaller = faster deployment) 3) Avoid heavy dependencies in initialization 4) Use AWS SnapStart for Java functions 5) Prefer smaller runtimes (Python over Java/.NET) 6) Keep global scope initialization minimal 7) Use Arm/Graviton2 architecture (better performance/dollar).', category: 'Cloud/DevOps', tags: ['AWS Lambda', 'serverless', 'performance', 'cold start'], votes: 47, views: 820, user: bob._id, createdAt: new Date('2026-05-24') },
      { question: 'What is the difference between JWT and session-based auth?', answer: 'JWT (stateless): token stored client-side, contains user data, verified with secret/key, scalable, cannot be revoked without blacklist. Session (stateful): session ID stored server-side, typically in Redis/DB, easier to invalidate, scales with storage. JWT pros: horizontal scaling, no DB lookup per request. Session pros: easy invalidation, smaller payload, traditional familiarity.', category: 'Programming', tags: ['JWT', 'authentication', 'security', 'sessions'], votes: 119, views: 2450, user: alice._id, createdAt: new Date('2026-05-25') },
    ];

    const faqs = await FAQ.insertMany(faqData);

    // Update category counts
    for (const faq of faqs) {
      await Category.findOneAndUpdate({ name: faq.category }, { $inc: { faqCount: 1 } });
    }

    // Rich activity feed
    const activityTypes = [
      { type: 'faq_created', user: admin._id, description: 'Added FAQ: "What is RAG in AI?"', target: faqs[11]._id },
      { type: 'faq_created', user: alice._id, description: 'Added FAQ: "How to reduce Lambda cold start latency"', target: faqs[13]._id },
      { type: 'ai_response', user: bob._id, description: 'AI resolved: "How does Kubernetes networking work?"' },
      { type: 'user_signup', user: carol._id, description: 'Carol Singh joined Crowd' },
      { type: 'faq_voted', user: carol._id, description: 'Upvoted: "How do I design a good REST API?"', target: faqs[10]._id },
      { type: 'faq_created', user: bob._id, description: 'Added FAQ: "What is Docker and when should I use it?"', target: faqs[8]._id },
      { type: 'issue_resolved', user: admin._id, description: 'Marked as solved: "How does health insurance work in the USA?"', target: faqs[7]._id },
      { type: 'ai_response', user: david._id, description: 'AI resolved: "Best practices for React state management"' },
      { type: 'faq_created', user: carol._id, description: 'Added FAQ: "What is the difference between JWT and session-based auth?"', target: faqs[14]._id },
      { type: 'admin_action', user: admin._id, description: 'Admin removed spam FAQ from "Finance" category' },
      { type: 'faq_created', user: eva._id, description: 'Added FAQ: "What are Figma components and variants?"', target: faqs[12]._id },
      { type: 'comment_added', user: alice._id, description: 'Commented on: "How to train a CNN model from scratch"' },
      { type: 'faq_voted', user: bob._id, description: 'Upvoted: "What is the best programming language for beginners?"', target: faqs[2]._id },
      { type: 'user_signup', user: eva._id, description: 'Eva Müller joined Crowd' },
      { type: 'ai_response', user: alice._id, description: 'AI resolved: "How to implement dark mode in Tailwind CSS"' },
      { type: 'issue_resolved', user: carol._id, description: 'Marked as solved: "What is Docker and when should I use it?"', target: faqs[8]._id },
    ];

    const now = Date.now();
    for (let i = 0; i < activityTypes.length; i++) {
      await Activity.create({
        ...activityTypes[i],
        createdAt: new Date(now - (activityTypes.length - i) * 1000 * 60 * 12), // 12 min apart
      });
    }

    // Chats
    const chatData = [
      { user: admin._id, messages: [{ role: 'user', content: 'How do I implement RAG pipeline?' }, { role: 'assistant', content: 'To implement RAG: 1) Choose a vector DB (Pinecone, Weaviate, or Milvus) 2) Embed your documents using OpenAI ada-002 or sentence-transformers 3) Store embeddings with metadata 4) At query time, embed the question and retrieve top-k relevant docs 5) Send retrieved context + question to your LLM 6) Return the generated answer with sources. Frameworks: LangChain, LlamaIndex, Haystack.' }], resolved: true, faqCreated: false },
      { user: alice._id, messages: [{ role: 'user', content: 'Best way to handle authentication in Next.js?' }, { role: 'assistant', content: 'For Next.js authentication: use NextAuth.js (Auth.js) for OAuth, credentials, or JWT. It handles sessions, callbacks, and works with various providers. Alternative: Clerk (managed auth with pre-built UI). For simple cases, roll your own with httpOnly cookies + JWT. Always use HTTPS, implement CSRF protection, and set secure cookie flags.' }], resolved: true, faqCreated: false },
      { user: bob._id, messages: [{ role: 'user', content: 'How to scale PostgreSQL for high traffic?' }, { role: 'assistant', content: 'PostgreSQL scaling strategies: 1) Read replicas (PgBouncer for connection pooling) 2) Partition large tables by date or range 3) Use EXPLAIN ANALYZE to optimize slow queries 4) Add indexes strategically (avoid over-indexing) 5) Consider Citus extension for horizontal sharding 6) Cache frequent queries with Redis 7) Use connection poolers (PgBouncer, Supavisor). Start with query optimization before sharding.' }], resolved: true, faqCreated: false },
      { user: carol._id, messages: [{ role: 'user', content: 'What is the best way to structure a React monorepo?' }, { role: 'assistant', content: 'For React monorepo: use Turborepo or Nx. Recommended structure: apps/web (main app), apps/api (backend), packages/ui (shared components), packages/utils (shared utilities), packages/ts-config, packages/eslint-config. Use pnpm workspaces. Benefits: code sharing, consistent tooling, atomic commits across packages.' }], resolved: true, faqCreated: false },
      { user: david._id, messages: [{ role: 'user', content: 'How does Kubernetes handle service discovery?' }, { role: 'assistant', content: 'Kubernetes service discovery via DNS: 1) Each Service gets a stableClusterIP and DNS name (my-svc.my-namespace.svc.cluster.local) 2) CoreDNS resolves names automatically 3) Pods can reach services via name (my-svc) or FQDN 4) Headless Services (clusterIP: None) return pod IPs directly for stateful apps 5) Ingress objects expose services externally with host/path routing.' }], resolved: false, faqCreated: false },
    ];

    await Chat.insertMany(chatData.map((c, i) => ({ ...c, createdAt: new Date(now - (chatData.length - i) * 1000 * 60 * 45) })));

    // Search failures
    const searchFailures = [
      { query: 'how to implement dark mode in material ui', count: 14 },
      { query: 'best react state management library 2026', count: 11 },
      { query: 'kubernetes autoscaling not working', count: 9 },
      { query: 'postgresql deadlock resolution', count: 7 },
      { query: 'how to train llama 3 locally', count: 6 },
      { query: 'figma auto layout not responsive', count: 5 },
      { query: 'aws lambda function timeout issue', count: 5 },
      { query: 'docker compose multi-stage build', count: 4 },
      { query: 'nextauth session not persisting', count: 4 },
      { query: 'how to implement vector search in production', count: 3 },
    ];
    await SearchFailure.insertMany(searchFailures.map((f, i) => ({ ...f, lastSearched: new Date(now - i * 1000 * 60 * 20) })));

    console.log(`✅ Seeded:`);
    console.log(`   ${categories.length} categories`);
    console.log(`   ${users.length} users (xp: ${users.map(u => `${u.name}=${u.xp}`).join(', ')})`);
    console.log(`   ${faqs.length} FAQs`);
    console.log(`   ${activityTypes.length} activity events`);
    console.log(`   ${chatData.length} chat sessions`);
    console.log(`   ${searchFailures.length} search failures`);
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin@crowd.faq / password123');
    console.log('   Users: jane@example.com, demo@crowd.faq, carol@example.com, david@example.com, eva@example.com / password123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedData();
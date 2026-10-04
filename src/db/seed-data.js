// Demo content created on first start. Lesson notes and tutorial chapters
// live as Markdown files in seed-assets/content.

module.exports = {
  learners: [
    { name: 'Aarav Sharma', email: 'aarav@example.com', daysAgo: 13 },
    { name: 'Priya Patel', email: 'priya@example.com', daysAgo: 11 },
    { name: 'Rohan Verma', email: 'rohan@example.com', daysAgo: 9 },
    { name: 'Sneha Iyer', email: 'sneha@example.com', daysAgo: 9 },
    { name: 'Kabir Singh', email: 'kabir@example.com', daysAgo: 6, banned: true },
    { name: 'Ananya Gupta', email: 'ananya@example.com', daysAgo: 4 },
    { name: 'Vikram Rao', email: 'vikram@example.com', daysAgo: 3 },
    { name: 'Meera Nair', email: 'meera@example.com', daysAgo: 1 },
  ],

  courses: [
    {
      title: 'Python for Absolute Beginners',
      slug: 'python-for-absolute-beginners',
      summary: 'Go from zero to writing real Python programs. No prior coding experience needed.',
      description: `Python is the friendliest first language there is, and it is used everywhere: web apps, automation, data science and AI.

In this course you will:

- Install Python and write your first program
- Learn variables, strings, conditionals, loops and functions
- Work with lists and dictionaries like a pro
- Build a **number guessing game** from scratch

Every lesson comes with notes and code you can copy, so you can learn at your own pace.`,
      category: 'Python',
      level: 'Beginner',
      thumbnail: '/img/covers/python.svg',
      published: true,
      featured: true,
      lessons: [
        { title: 'Introduction & setting up Python', duration: '0:10', video: true, preview: true, content: 'courses/python/01-introduction.md' },
        { title: 'Variables and data types', duration: '0:10', video: true, content: 'courses/python/02-variables.md' },
        { title: 'Strings and user input', duration: '7 min read', content: 'courses/python/03-strings.md' },
        { title: 'Making decisions with if / elif / else', duration: '6 min read', content: 'courses/python/04-conditionals.md' },
        { title: 'Loops: for and while', duration: '8 min read', content: 'courses/python/05-loops.md' },
        { title: 'Functions', duration: '8 min read', content: 'courses/python/06-functions.md' },
        { title: 'Lists and dictionaries', duration: '9 min read', content: 'courses/python/07-collections.md' },
        {
          title: 'Project: number guessing game',
          duration: '10 min read',
          content: 'courses/python/08-project.md',
          resource: 'number-guessing-game.zip',
        },
      ],
    },
    {
      title: 'Modern JavaScript Bootcamp',
      slug: 'modern-javascript-bootcamp',
      summary: 'Learn the JavaScript that powers every website: from variables to async/await and the DOM.',
      description: `JavaScript is the language of the web. This bootcamp teaches **modern** JavaScript (ES2015+) the way it is written today.

You will learn how JavaScript runs in the browser, how to work with functions, arrays and objects, how to make pages interactive with the DOM, and how to handle asynchronous code with promises and \`async/await\`.`,
      category: 'JavaScript',
      level: 'Beginner',
      thumbnail: '/img/covers/javascript.svg',
      published: true,
      featured: true,
      lessons: [
        { title: 'How JavaScript runs', duration: '0:10', video: true, preview: true, content: 'courses/javascript/01-how-js-runs.md' },
        { title: 'let, const and var', duration: '6 min read', content: 'courses/javascript/02-variables.md' },
        { title: 'Functions and arrow functions', duration: '8 min read', content: 'courses/javascript/03-functions.md' },
        { title: 'Arrays and objects', duration: '9 min read', content: 'courses/javascript/04-arrays-objects.md' },
        { title: 'Working with the DOM', duration: '0:10', video: true, content: 'courses/javascript/05-dom.md' },
        { title: 'Promises and async/await', duration: '10 min read', content: 'courses/javascript/06-async.md' },
      ],
    },
    {
      title: 'HTML & CSS: Build Your First Website',
      slug: 'html-css-build-your-first-website',
      summary: 'Structure pages with semantic HTML and style them with modern, responsive CSS.',
      description: `Every web developer starts here. You will learn how the web works, write **semantic HTML**, and style pages with CSS, including Flexbox and responsive design.

By the end you will have built and styled a complete personal portfolio page that looks great on phones and desktops.`,
      category: 'Web Development',
      level: 'Beginner',
      thumbnail: '/img/covers/webdev.svg',
      published: true,
      featured: true,
      lessons: [
        { title: 'How the web works', duration: '0:10', video: true, preview: true, content: 'courses/webdev/01-how-the-web-works.md' },
        { title: 'Your first HTML page', duration: '6 min read', content: 'courses/webdev/02-first-page.md' },
        { title: 'Semantic HTML', duration: '7 min read', content: 'courses/webdev/03-semantic-html.md' },
        { title: 'CSS selectors and the box model', duration: '9 min read', content: 'courses/webdev/04-box-model.md' },
        { title: 'Flexbox layouts', duration: '9 min read', content: 'courses/webdev/05-flexbox.md' },
        { title: 'Responsive design with media queries', duration: '8 min read', content: 'courses/webdev/06-responsive.md' },
      ],
    },
    {
      title: 'Data Structures & Algorithms in C++',
      slug: 'data-structures-and-algorithms-in-cpp',
      summary: 'Crack coding interviews: complexity analysis, arrays, linked lists, stacks and queues in C++.',
      description: `Data structures and algorithms are the foundation of every technical interview. This course teaches you to **analyse** code with Big-O notation and to implement the core data structures yourself in C++.`,
      category: 'DSA',
      level: 'Intermediate',
      thumbnail: '/img/covers/dsa.svg',
      published: true,
      featured: false,
      lessons: [
        { title: 'Big-O notation', duration: '0:10', video: true, preview: true, content: 'courses/dsa/01-big-o.md' },
        { title: 'Arrays and the two-pointer technique', duration: '8 min read', content: 'courses/dsa/02-arrays.md' },
        { title: 'Linked lists', duration: '9 min read', content: 'courses/dsa/03-linked-lists.md' },
        { title: 'Stacks and queues', duration: '8 min read', content: 'courses/dsa/04-stacks-queues.md' },
      ],
    },
    {
      title: 'React for Beginners',
      slug: 'react-for-beginners',
      summary: 'Build interactive user interfaces with components, props, state and hooks.',
      description: 'A work-in-progress course. It is saved as a **draft**, so only admins can see it until it is published.',
      category: 'JavaScript',
      level: 'Intermediate',
      thumbnail: null,
      published: false,
      featured: false,
      lessons: [{ title: 'What is React?', duration: '5 min read', content: 'courses/react/01-what-is-react.md' }],
    },
  ],

  tutorials: [
    {
      title: 'Python Tutorial',
      slug: 'python',
      description: 'Learn Python step by step, from installation to functions, with runnable examples.',
      category: 'Programming',
      badge: 'Py',
      published: true,
      chapters: [
        { title: 'Introduction to Python', content: 'tutorials/python/01-introduction.md' },
        { title: 'Installing Python', content: 'tutorials/python/02-installation.md' },
        { title: 'Your first Python program', content: 'tutorials/python/03-first-program.md' },
        { title: 'Variables and data types', content: 'tutorials/python/04-variables.md' },
        { title: 'Strings', content: 'tutorials/python/05-strings.md' },
        { title: 'Lists', content: 'tutorials/python/06-lists.md' },
        { title: 'Conditionals', content: 'tutorials/python/07-conditionals.md' },
        { title: 'Loops', content: 'tutorials/python/08-loops.md' },
        { title: 'Functions', content: 'tutorials/python/09-functions.md' },
      ],
    },
    {
      title: 'JavaScript Tutorial',
      slug: 'javascript',
      description: 'A practical guide to JavaScript fundamentals for the browser and beyond.',
      category: 'Programming',
      badge: 'JS',
      published: true,
      chapters: [
        { title: 'What is JavaScript?', content: 'tutorials/javascript/01-introduction.md' },
        { title: 'Variables', content: 'tutorials/javascript/02-variables.md' },
        { title: 'Data types', content: 'tutorials/javascript/03-data-types.md' },
        { title: 'Functions', content: 'tutorials/javascript/04-functions.md' },
        { title: 'Arrays', content: 'tutorials/javascript/05-arrays.md' },
        { title: 'Objects', content: 'tutorials/javascript/06-objects.md' },
        { title: 'DOM basics', content: 'tutorials/javascript/07-dom.md' },
      ],
    },
    {
      title: 'HTML Tutorial',
      slug: 'html',
      description: 'The building blocks of every web page: elements, links, images, lists, tables and forms.',
      category: 'Web Development',
      badge: 'HTML',
      published: true,
      chapters: [
        { title: 'Introduction to HTML', content: 'tutorials/html/01-introduction.md' },
        { title: 'Page structure', content: 'tutorials/html/02-structure.md' },
        { title: 'Headings, paragraphs and text', content: 'tutorials/html/03-text.md' },
        { title: 'Links and images', content: 'tutorials/html/04-links-images.md' },
        { title: 'Lists and tables', content: 'tutorials/html/05-lists-tables.md' },
        { title: 'Forms', content: 'tutorials/html/06-forms.md' },
      ],
    },
    {
      title: 'CSS Tutorial',
      slug: 'css',
      description: 'Style the web: selectors, colours, the box model, Flexbox and Grid.',
      category: 'Web Development',
      badge: 'CSS',
      published: true,
      chapters: [
        { title: 'Introduction to CSS', content: 'tutorials/css/01-introduction.md' },
        { title: 'Selectors', content: 'tutorials/css/02-selectors.md' },
        { title: 'The box model', content: 'tutorials/css/03-box-model.md' },
        { title: 'Flexbox', content: 'tutorials/css/04-flexbox.md' },
        { title: 'Grid', content: 'tutorials/css/05-grid.md' },
      ],
    },
    {
      title: 'Git & GitHub Tutorial',
      slug: 'git',
      description: 'Version control for everyone: commits, branches and collaborating on GitHub.',
      category: 'Tools',
      badge: 'Git',
      published: false,
      chapters: [
        { title: 'What is Git?', content: 'tutorials/git/01-what-is-git.md' },
        { title: 'Your first commit', content: 'tutorials/git/02-first-commit.md' },
      ],
    },
  ],

  // Course slug -> number of lessons the demo student has completed.
  studentProgress: {
    'python-for-absolute-beginners': 3,
    'html-css-build-your-first-website': 1,
  },
};

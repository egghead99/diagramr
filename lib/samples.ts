export interface Generation {
  id: string
  name: string
  type: "venn" | "force" | "circuit"
  createdAt: Date
  prompt: string
  content: string
  userId: string
}

/* export const PAST_GENERATIONS: Generation[] = [
  {
    id: "1",
    name: "The Web Stack",
    type: "venn",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    prompt: "Compare frontend and backend web development technologies",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="blue" color-2="red">
        <title>The Web Stack</title>
        <circle header="Backend">
            <item>Runs on the Server</item>
            <item>Database logic</item>
            <item>Node / Python / Go</item>
        </circle>
        <circle header="Frontend">
            <item>Runs in the Browser</item>
            <item>User Interface</item>
            <item>HTML / CSS / JS</item>
        </circle>
        <overlap>
            <item>HTTP / JSON</item>
            <item>REST &amp; GraphQL</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "2",
    name: "Life vs. Machine",
    type: "venn",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    prompt: "Venn diagram comparing biological life and artificial machinery",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="emerald" color-2="slate">
        <title>Life vs. Machine</title>
        <circle header="Biological">
            <item>DNA based</item>
            <item>Self-repairing</item>
            <item>Metabolism</item>
        </circle>
        <circle header="Artificial">
            <item>Silicon based</item>
            <item>Modular repair</item>
            <item>Electricity</item>
        </circle>
        <overlap>
            <item>Logic</item>
            <item>Information</item>
            <item>Complexity</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "3",
    name: "Creativity",
    type: "venn",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    prompt: "Compare art and science to explore creativity",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="amber" color-2="indigo">
        <title>Creativity</title>
        <circle header="Art">
            <item>Expression</item>
            <item>Subjective</item>
            <item>Aesthetics</item>
        </circle>
        <circle header="Science">
            <item>Discovery</item>
            <item>Objective</item>
            <item>Observation</item>
        </circle>
        <overlap>
            <item>Innovation</item>
            <item>Intuition</item>
            <item>Curiosity</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "4",
    name: "Social Media",
    type: "venn",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    prompt:
      "Venn diagram comparing entertainment and networking platforms in social media",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="rose" color-2="sky">
        <title>Social Media</title>
        <circle header="Entertainment">
            <item>TikTok</item>
            <item>YouTube</item>
            <item>Short Video</item>
        </circle>
        <circle header="Networking">
            <item>LinkedIn</item>
            <item>Twitter</item>
            <item>Professional</item>
        </circle>
        <overlap>
            <item>Engagement</item>
            <item>Community</item>
            <item>Attention</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "5",
    name: "Healthy Lifestyle",
    type: "venn",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    prompt:
      "Venn diagram showing the relationship between diet and exercise in a healthy lifestyle",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="green" color-2="orange">
        <title>Healthy Lifestyle</title>
        <circle header="Diet">
            <item>Whole Foods</item>
            <item>Hydration</item>
            <item>Nutrients</item>
        </circle>
        <circle header="Exercise">
            <item>Strength</item>
            <item>Cardio</item>
            <item>Mobility</item>
        </circle>
        <overlap>
            <item>Energy</item>
            <item>Vitality</item>
            <item>Longevity</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "6",
    name: "Cloud Computing",
    type: "venn",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    prompt: "Compare AWS and GCP features and services",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="blue" color-2="purple">
        <title>Cloud Computing</title>
        <circle header="AWS">
            <item>EC2 / S3</item>
            <item>Market Leader</item>
            <item>Vast ecosystem</item>
        </circle>
        <circle header="GCP">
            <item>BigQuery</item>
            <item>Kubernetes Native</item>
            <item>AI / ML focus</item>
        </circle>
        <overlap>
            <item>Scalability</item>
            <item>Pay-as-you-go</item>
            <item>Security</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "7",
    name: "Classic Cocktails",
    type: "venn",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    prompt: "Venn diagram comparing Negroni and Martini ingredients",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="red" color-2="yellow">
        <title>Cocktails</title>
        <circle header="Negroni">
            <item>Gin</item>
            <item>Campari</item>
            <item>Sweet Vermouth</item>
        </circle>
        <circle header="Martini">
            <item>Gin / Vodka</item>
            <item>Dry Vermouth</item>
            <item>Olive / Twist</item>
        </circle>
        <overlap>
            <item>Gin</item>
            <item>Sophisticated</item>
            <item>Aperitif</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "8",
    name: "Learning",
    type: "venn",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    prompt: "Compare theory and practice in the learning process",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="indigo" color-2="pink">
        <title>Learning</title>
        <circle header="Theory">
            <item>Lectures</item>
            <item>Reading</item>
            <item>Concepts</item>
        </circle>
        <circle header="Practice">
            <item>Projects</item>
            <item>Coding</item>
            <item>Mistakes</item>
        </circle>
        <overlap>
            <item>Mastery</item>
            <item>Understanding</item>
            <item>Growth</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "9",
    name: "E-commerce",
    type: "venn",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    prompt: "Venn diagram comparing B2C and B2B e-commerce structures",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="blue" color-2="orange">
        <title>E-commerce</title>
        <circle header="B2C">
            <item>Amazon</item>
            <item>Direct to Consumer</item>
            <item>Retail Focus</item>
        </circle>
        <circle header="B2B">
            <item>Alibaba</item>
            <item>Wholesale</item>
            <item>Bulk Orders</item>
        </circle>
        <overlap>
            <item>Logistics</item>
            <item>Payments</item>
            <item>Inventory</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "10",
    name: "Mobile Apps",
    type: "venn",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    prompt: "Compare iOS and Android app development features",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="slate" color-2="emerald">
        <title>Mobile Development</title>
        <circle header="iOS">
            <item>Swift / SwiftUI</item>
            <item>App Store</item>
            <item>Premium hardware</item>
        </circle>
        <circle header="Android">
            <item>Kotlin / Compose</item>
            <item>Play Store</item>
            <item>Diverse devices</item>
        </circle>
        <overlap>
            <item>Mobile UX</item>
            <item>Touch Input</item>
            <item>Notifications</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "11",
    name: "Coffee Culture",
    type: "venn",
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    prompt: "Compare Espresso vs Filter coffee brewing methods",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="orange" color-2="brown">
        <title>Coffee Methods</title>
        <circle header="Espresso">
            <item>Pressure based</item>
            <item>Quick extraction</item>
            <item>Intense flavor</item>
        </circle>
        <circle header="Filter">
            <item>Gravity based</item>
            <item>Slow drip</item>
            <item>Clarity of taste</item>
        </circle>
        <overlap>
            <item>Caffeine</item>
            <item>Aroma</item>
            <item>Roast profile</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "12",
    name: "Data Science",
    type: "venn",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    prompt: "Venn diagram comparing statistics and programming in data science",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="blue" color-2="violet">
        <title>Data Science</title>
        <circle header="Statistics">
            <item>Probability</item>
            <item>Inference</item>
            <item>Hypothesis tests</item>
        </circle>
        <circle header="Programming">
            <item>Python / R</item>
            <item>Data Cleaning</item>
            <item>Algorithms</item>
        </circle>
        <overlap>
            <item>Insights</item>
            <item>Modeling</item>
            <item>Prediction</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "13",
    name: "Web Browsers",
    type: "venn",
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    prompt: "Venn diagram comparing Chrome and Safari web browsers",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="red" color-2="sky">
        <title>Browsers</title>
        <circle header="Chrome">
            <item>Chromium engine</item>
            <item>Google Sync</item>
            <item>Resource heavy</item>
        </circle>
        <circle header="Safari">
            <item>WebKit engine</item>
            <item>Apple ecosystem</item>
            <item>Energy efficient</item>
        </circle>
        <overlap>
            <item>Web Standards</item>
            <item>Extensions</item>
            <item>DevTools</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "14",
    name: "Photography",
    type: "venn",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    prompt: "Compare digital and film photography processes",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="amber" color-2="slate">
        <title>Photography</title>
        <circle header="Digital">
            <item>Instant preview</item>
            <item>Low cost per shot</item>
            <item>Sensors</item>
        </circle>
        <circle header="Film">
            <item>Delayed gratification</item>
            <item>Physical negatives</item>
            <item>Chemical process</item>
        </circle>
        <overlap>
            <item>Composition</item>
            <item>Lighting</item>
            <item>Storytelling</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "15",
    name: "Remote Work",
    type: "venn",
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    prompt: "Compare office-based and remote work models",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="indigo" color-2="emerald">
        <title>Work Models</title>
        <circle header="Office">
            <item>Face-to-face</item>
            <item>Structured hours</item>
            <item>Watercooler talk</item>
        </circle>
        <circle header="Remote">
            <item>Flexibility</item>
            <item>No commute</item>
            <item>Global talent</item>
        </circle>
        <overlap>
            <item>Collaboration</item>
            <item>Deadlines</item>
            <item>Productivity</item>
        </overlap>
      </venn>
    `,
  },
  {
    id: "16",
    name: "Music Platforms",
    type: "venn",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    prompt: "Venn diagram comparing Spotify and Apple Music streaming services",
    content: `
      <venn title-font="serif" header-font="sans-serif" body-font="mono" color-1="green" color-2="red">
        <title>Music Streaming</title>
        <circle header="Spotify">
            <item>Personalization</item>
            <item>Social features</item>
            <item>Vast library</item>
        </circle>
        <circle header="Apple Music">
            <item>Lossless Audio</item>
            <item>Curated radio</item>
            <item>Library integration</item>
        </circle>
        <overlap>
            <item>Subscription</item>
            <item>Offline listening</item>
            <item>Playlists</item>
        </overlap>
      </venn>
    `,
  },
] */

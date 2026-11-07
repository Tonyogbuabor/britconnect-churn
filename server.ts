import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialise Gemini SDK
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Executive Summary Endpoint
app.post('/api/gemini/executive-summary', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server environment. Please configure GEMINI_API_KEY in the Secrets panel.',
      });
    }

    const { metrics, filterContext } = req.body;
    if (!metrics) {
      return res.status(400).json({ error: 'Missing metrics payload' });
    }

    const prompt = `
You are the Lead Telecom Retention Strategist for BritConnect, a major UK telecom provider.
Analyze the following exact computed customer metrics (Currency: GBP £, Date context: UK November 2026).
NEVER invent any numbers. CITE EVERY EXACT FIGURE from the metrics provided.

Current Scope / Filters: ${filterContext || 'All Active & Churned Customer Records'}

Computed Metrics:
- Total Customers: ${metrics.totalCustomers}
- Active Customers: ${metrics.activeCustomers} (${metrics.activePct}%)
- Churned Customers: ${metrics.churnedCustomers} (${metrics.churnRate}%)
- Monthly Recurring Revenue (MRR): £${metrics.mrr?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Monthly Revenue At Risk (Model-based): £${metrics.revenueAtRisk?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- 12-Month Expected Revenue Loss: £${metrics.expectedLoss12M?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Average Customer Tenure: ${metrics.avgTenure} months
- Average Satisfaction Score: ${metrics.avgSatisfaction} / 10
- Net NPS: ${metrics.netNps}
- Critical Risk Customers (Prob >= 70%): ${metrics.criticalRiskCount} (£${metrics.criticalRevenueAtRisk?.toLocaleString('en-GB')} / mo)
- High Risk Customers (Prob 50-69%): ${metrics.highRiskCount}
- Contracts Expiring in <= 30 Days: ${metrics.expiring30Days}
- Top Churn Reasons: ${JSON.stringify(metrics.topReasons || [])}
- Highest Risk Segments: ${JSON.stringify(metrics.highRiskSegments || [])}

Provide exactly 5-7 concise, high-impact executive bullets.
Structure:
- 1 bullet on base stability and primary revenue exposure (cite £ and % numbers)
- 1-2 bullets on key behavioural & operational drivers (e.g. contract expirations, complaint handling, network outages)
- 1 bullet on customer sentiment and NPS correlation
- 2 bullets on immediate, commercially-justified retention priority actions

Tone: British English, authoritative, concise, data-grounded. Do not use generic filler.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an executive retention data analyst for BritConnect UK. Use British English (e.g., analyse, standardise, colour) and GBP (£). Always cite exact provided figures.',
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Executive summary error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate executive summary' });
  }
});

// AI Customer & Cohort Recommendation Endpoint
app.post('/api/gemini/recommendation', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server environment.',
      });
    }

    const { type, customer, cohortSummary, assumptions } = req.body;

    const prompt = `
Generate a structured, evidence-based BritConnect Retention Action Plan.
Type: ${type} (Individual or Cohort)
Assumptions: Cost per contact £${assumptions?.costPerContact || 15}, Target save rate ${assumptions?.saveRate || 25}%, Margin ${assumptions?.marginPct || 70}%.

Data Provided:
${JSON.stringify(customer || cohortSummary, null, 2)}

You MUST format the response matching this exact structure:
1. Priority: (P1 / P2 / P3) with a transparent score based on churn probability, monthly revenue at risk, and intervention viability.
2. Situation & Evidence: Cite specific facts from the provided data (e.g. churn prob %, contract end days, complaints count, resolution hours, charges, overages).
3. Root Cause Hypothesis: State what underlying operational or pricing issue is triggering the risk.
4. Recommended Actions (Personalised): Concrete interventions (e.g. proactive renewal upgrade, service recovery call + £ credit, plan right-sizing). Apply offer sizing guardrails (discount cost <= 20% of annual retained margin).
5. Implementation Steps: Numbered steps with owner/team, channel (phone, email, SMS, account manager), timing (e.g. within 24h, T-45 days), talking points.
6. Expected Business Impact: Calculated retained monthly and 12-month revenue, estimated intervention cost, net benefit and ROI.
7. Measurable KPIs: Baseline metric, target metric, verification window.
8. Risks & Mitigations + Confidence Level (High/Medium/Low).

Use British English and GBP (£).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert retention strategist at BritConnect. Ground all figures strictly in the user data provided.',
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Recommendation generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendation' });
  }
});

// AI Chatbot with Grounded Query Execution
app.post('/api/gemini/chat', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server environment.',
      });
    }

    const { messages, datasetSummary } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array' });
    }

    const systemPrompt = `
You are the BritConnect AI Analytics Assistant, an expert analyst on customer churn, telecom operations, and retention campaigns for BritConnect UK.
All currency is in British Pounds (£ GBP). All dates follow DD/MM/YYYY.

GROUNDING RULES:
1. Never invent or hallucinate metrics. Rely strictly on the verified dataset summary provided below and the user's specific context.
2. When answering, provide precise figures, context, and clear strategic recommendations.
3. If an answer cannot be deduced from the provided data, state so clearly and specify what additional data or query is needed.
4. Answer concisely with clean markdown formatting, tables, or bullet points where appropriate.

VERIFIED DATASET CONTEXT:
${JSON.stringify(datasetSummary, null, 2)}
`;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat message' });
  }
});

// Explain Chart Endpoint
app.post('/api/gemini/explain-chart', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    const { chartTitle, chartData, filterContext } = req.body;

    const prompt = `
Explain the key insights and actionable takeaways from this chart: "${chartTitle}".
Scope / Filters: ${filterContext || 'Global filtered dataset'}

Chart Data Points:
${JSON.stringify(chartData, null, 2)}

Provide:
1. Primary observation (what is the dominant pattern or trend)
2. Risk hotspots (which categories or values exhibit disproportionate churn or revenue loss)
3. Operational implication (what the retention or customer service team should do about it)
Keep it under 150 words in clear British English.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are BritConnect retention analytics lead. Be concise, sharp, and data-driven.',
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mount Vite or static build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`BritConnect AI Platform server listening on port ${port}`);
  });
}

startServer();

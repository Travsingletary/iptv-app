import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check various system components
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VITE_APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        api: 'operational',
        database: await checkDatabase(),
        external_services: await checkExternalServices(),
      },
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        unit: 'MB'
      }
    };

    // Return 200 if all checks pass
    res.status(200).json(checks);
  } catch (error) {
    // Return 503 if health check fails
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

async function checkDatabase(): Promise<string> {
  try {
    // Add your database connectivity check here
    // For now, returning mock status
    return 'operational';
  } catch {
    return 'degraded';
  }
}

async function checkExternalServices(): Promise<string> {
  try {
    // Check external services (Supabase, etc.)
    return 'operational';
  } catch {
    return 'degraded';
  }
}
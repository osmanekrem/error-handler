/**
 * Middleware exports for popular frameworks
 */

// Express.js middleware
export { expressErrorMiddleware, asyncHandler } from './express';
export type { ExpressErrorMiddlewareOptions } from './express';

// Fastify plugin
export { fastifyErrorPlugin, createFastifyError } from './fastify';
export type { FastifyErrorPluginOptions } from './fastify';

// Hono middleware
export { honoErrorMiddleware, honoErrorHandler, createHonoError } from './hono';
export type { HonoErrorMiddlewareOptions } from './hono';

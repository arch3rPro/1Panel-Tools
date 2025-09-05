import { BrandDocker } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Docker Compose to 1Panel AppStore',
  path: '/docker-compose-to-1panel-appstore',
  description: 'Convert Docker Compose files to 1Panel AppStore format',
  keywords: ['docker', 'compose', '1panel', 'appstore', 'convert'],
  component: () => import('./docker-compose-to-1panel-appstore.vue'),
  icon: BrandDocker,
  createdAt: new Date('2025-09-03'),
  category: 'Docker',
});
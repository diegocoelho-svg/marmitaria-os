import type { Container } from '@/infrastructure/container/container'

export async function cleanup(container: Container): Promise<void> {
  await container.database.pool.end()
}

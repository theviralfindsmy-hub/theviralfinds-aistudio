import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Supabase Todos Test</h1>
      <ul className="list-disc pl-5 space-y-1">
        {todos?.map((todo: { id: string | number; name?: string; title?: string }) => (
          <li key={todo.id}>{todo.name || todo.title || JSON.stringify(todo)}</li>
        ))}
        {(!todos || todos.length === 0) && (
          <li className="text-muted-foreground text-sm italic">Tiada data todos dijumpai. (Hubungan Supabase aktif)</li>
        )}
      </ul>
    </div>
  )
}

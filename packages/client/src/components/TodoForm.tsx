import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { trpc } from '../api/trpc'
import { queryClient } from '../api/react-query'

export function TodoForm() {
  const [title, setTitle] = useState('')

  const addTodo = useMutation(
    trpc.todos.add.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.todos.getAll.queryKey()
        })
        setTitle('')
      }
    })
  )

  return (
    <form
      className='addForm'
      onSubmit={e => {
        e.preventDefault()
        const trimmed = title.trim()
        if (!trimmed) return
        addTodo.mutate({ title: trimmed })
      }}
    >
      <input
        className='input'
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder='What needs to be done?'
        autoComplete='off'
      />
      <button
        className='button'
        type='submit'
        disabled={addTodo.isPending || !title.trim()}
      >
        {addTodo.isPending ? 'Adding…' : 'Add'}
      </button>
    </form>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createConversation, listConversations, listMessages } from '../api/conversations'

export function useConversations() {
  return useQuery({ queryKey: ['conversations'], queryFn: listConversations })
}

export function useConversationMessages(conversationId: number) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => listMessages(conversationId),
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentIds: number[]) => createConversation(documentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

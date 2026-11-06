'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  Pin,
  PinOff,
  Search,
  Phone,
  MoreVertical,
  Smile,
  Paperclip,
  Star,
  Clock,
  Check,
  CheckCheck,
  Bot,
  X,
  ChevronLeft,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/* ============================================================
   Types
   ============================================================ */

type MessageType = 'text' | 'image' | 'sticker' | 'product_card' | 'order_card'

interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  type: MessageType
  timestamp: string
  read: boolean
  imageUrl?: string
  productInfo?: { name: string; price: string; image: string }
  orderInfo?: { orderId: string; status: string; total: string }
}

interface Conversation {
  id: string
  buyerName: string
  buyerInitials: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isPinned: boolean
  isOnline: boolean
  avatarColor: string
}

interface ChatStats {
  totalConversations: number
  unreadMessages: number
  avgResponseTime: string
  responseRate: string
}

/* ============================================================
   Mock Data
   ============================================================ */

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    buyerName: 'Aisyah Rahman',
    buyerInitials: 'AR',
    lastMessage: 'Hi, is the wireless earbuds still available?',
    lastMessageTime: '2 min ago',
    unreadCount: 3,
    isPinned: true,
    isOnline: true,
    avatarColor: 'bg-shopee/15 text-shopee',
  },
  {
    id: 'conv-2',
    buyerName: 'Mohd Faiz',
    buyerInitials: 'MF',
    lastMessage: 'Can I get a discount for bulk order?',
    lastMessageTime: '8 min ago',
    unreadCount: 1,
    isPinned: true,
    isOnline: true,
    avatarColor: 'bg-lime/15 text-lime-dark',
  },
  {
    id: 'conv-3',
    buyerName: 'Siti Nurhaliza',
    buyerInitials: 'SN',
    lastMessage: 'Thanks for the quick delivery! 🎉',
    lastMessageTime: '25 min ago',
    unreadCount: 0,
    isPinned: false,
    isOnline: true,
    avatarColor: 'bg-hermes/15 text-hermes',
  },
  {
    id: 'conv-4',
    buyerName: 'Ahmad Razak',
    buyerInitials: 'AZ',
    lastMessage: 'When will the stock be replenished?',
    lastMessageTime: '1 hr ago',
    unreadCount: 2,
    isPinned: false,
    isOnline: false,
    avatarColor: 'bg-profit/15 text-profit',
  },
  {
    id: 'conv-5',
    buyerName: 'Nurul Izzah',
    buyerInitials: 'NI',
    lastMessage: 'I received the wrong item 😞',
    lastMessageTime: '2 hrs ago',
    unreadCount: 0,
    isPinned: false,
    isOnline: false,
    avatarColor: 'bg-orange-500/15 text-orange-600',
  },
  {
    id: 'conv-6',
    buyerName: 'Kamal Hassan',
    buyerInitials: 'KH',
    lastMessage: 'Can you do RM45 for 2 units?',
    lastMessageTime: '3 hrs ago',
    unreadCount: 0,
    isPinned: false,
    isOnline: true,
    avatarColor: 'bg-rose-500/15 text-rose-600',
  },
  {
    id: 'conv-7',
    buyerName: 'Li Wei Tan',
    buyerInitials: 'LT',
    lastMessage: 'Is this compatible with iPhone 15?',
    lastMessageTime: '5 hrs ago',
    unreadCount: 0,
    isPinned: false,
    isOnline: false,
    avatarColor: 'bg-sky-500/15 text-sky-600',
  },
  {
    id: 'conv-8',
    buyerName: 'Priya Devi',
    buyerInitials: 'PD',
    lastMessage: 'Okay placed order already! Thanks!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isPinned: false,
    isOnline: false,
    avatarColor: 'bg-violet-500/15 text-violet-600',
  },
]

const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'm1-1', conversationId: 'conv-1', senderId: 'buyer', senderName: 'Aisyah Rahman',
      content: 'Hi there! 👋', type: 'text', timestamp: '10:30 AM', read: true,
    },
    {
      id: 'm1-2', conversationId: 'conv-1', senderId: 'seller', senderName: 'You',
      content: 'Hello Aisyah! How can I help you today?', type: 'text', timestamp: '10:31 AM', read: true,
    },
    {
      id: 'm1-3', conversationId: 'conv-1', senderId: 'buyer', senderName: 'Aisyah Rahman',
      content: 'I saw the wireless earbuds on your shop. Are they still in stock?', type: 'text', timestamp: '10:32 AM', read: true,
    },
    {
      id: 'm1-4', conversationId: 'conv-1', senderId: 'seller', senderName: 'You',
      content: 'Yes! We have the TWS Pro Earbuds in black, white and blue. Which color are you interested in?', type: 'text', timestamp: '10:33 AM', read: true,
    },
    {
      id: 'm1-5', conversationId: 'conv-1', senderId: 'buyer', senderName: 'Aisyah Rahman',
      content: '', type: 'product_card', timestamp: '10:35 AM', read: true,
      productInfo: { name: 'TWS Pro Earbuds X1', price: 'RM 89.90', image: '/earbuds.jpg' },
    },
    {
      id: 'm1-6', conversationId: 'conv-1', senderId: 'buyer', senderName: 'Aisyah Rahman',
      content: 'This one! Is the black still available?', type: 'text', timestamp: '10:35 AM', read: false,
    },
    {
      id: 'm1-7', conversationId: 'conv-1', senderId: 'buyer', senderName: 'Aisyah Rahman',
      content: 'Hi, is the wireless earbuds still available?', type: 'text', timestamp: '10:40 AM', read: false,
    },
  ],
  'conv-2': [
    {
      id: 'm2-1', conversationId: 'conv-2', senderId: 'buyer', senderName: 'Mohd Faiz',
      content: 'Salam boss! I want to buy 10 units of the phone case', type: 'text', timestamp: '9:15 AM', read: true,
    },
    {
      id: 'm2-2', conversationId: 'conv-2', senderId: 'seller', senderName: 'You',
      content: 'Salam! Wow 10 units, which model do you need?', type: 'text', timestamp: '9:16 AM', read: true,
    },
    {
      id: 'm2-3', conversationId: 'conv-2', senderId: 'buyer', senderName: 'Mohd Faiz',
      content: '', type: 'product_card', timestamp: '9:18 AM', read: true,
      productInfo: { name: 'Premium Silicone Case iPhone 15', price: 'RM 19.90', image: '/case.jpg' },
    },
    {
      id: 'm2-4', conversationId: 'conv-2', senderId: 'buyer', senderName: 'Mohd Faiz',
      content: 'Can I get a discount for bulk order?', type: 'text', timestamp: '9:18 AM', read: false,
    },
  ],
  'conv-3': [
    {
      id: 'm3-1', conversationId: 'conv-3', senderId: 'seller', senderName: 'You',
      content: 'Hi Siti! Your order has been shipped 📦', type: 'text', timestamp: '8:00 AM', read: true,
    },
    {
      id: 'm3-2', conversationId: 'conv-3', senderId: 'buyer', senderName: 'Siti Nurhaliza',
      content: '', type: 'order_card', timestamp: '9:30 AM', read: true,
      orderInfo: { orderId: 'SHP2025030400123', status: 'Delivered', total: 'RM 149.90' },
    },
    {
      id: 'm3-3', conversationId: 'conv-3', senderId: 'buyer', senderName: 'Siti Nurhaliza',
      content: 'Thanks for the quick delivery! 🎉', type: 'text', timestamp: '9:31 AM', read: true,
    },
    {
      id: 'm3-4', conversationId: 'conv-3', senderId: 'seller', senderName: 'You',
      content: 'You\'re welcome! Enjoy your purchase 😊 Don\'t forget to leave a review!', type: 'text', timestamp: '9:32 AM', read: true,
    },
  ],
  'conv-4': [
    {
      id: 'm4-1', conversationId: 'conv-4', senderId: 'buyer', senderName: 'Ahmad Razak',
      content: 'When will the RGB keyboard be restocked?', type: 'text', timestamp: '8:00 AM', read: true,
    },
    {
      id: 'm4-2', conversationId: 'conv-4', senderId: 'buyer', senderName: 'Ahmad Razak',
      content: 'I need it for my new setup la', type: 'text', timestamp: '8:01 AM', read: false,
    },
  ],
  'conv-5': [
    {
      id: 'm5-1', conversationId: 'conv-5', senderId: 'buyer', senderName: 'Nurul Izzah',
      content: 'I ordered the blue one but received the red one 😞', type: 'text', timestamp: '7:00 AM', read: true,
    },
    {
      id: 'm5-2', conversationId: 'conv-5', senderId: 'seller', senderName: 'You',
      content: 'Oh no! So sorry about that. Let me arrange a replacement for you right away.', type: 'text', timestamp: '7:05 AM', read: true,
    },
    {
      id: 'm5-3', conversationId: 'conv-5', senderId: 'buyer', senderName: 'Nurul Izzah',
      content: 'I received the wrong item 😞', type: 'text', timestamp: '7:30 AM', read: true,
    },
  ],
  'conv-6': [
    {
      id: 'm6-1', conversationId: 'conv-6', senderId: 'buyer', senderName: 'Kamal Hassan',
      content: 'Bro can you do RM45 for 2 units of the cable?', type: 'text', timestamp: '6:00 AM', read: true,
    },
    {
      id: 'm6-2', conversationId: 'conv-6', senderId: 'seller', senderName: 'You',
      content: 'Each unit is RM25, so 2 for RM50. I can do RM48 for you 😄', type: 'text', timestamp: '6:02 AM', read: true,
    },
    {
      id: 'm6-3', conversationId: 'conv-6', senderId: 'buyer', senderName: 'Kamal Hassan',
      content: 'Can you do RM45 for 2 units?', type: 'text', timestamp: '6:05 AM', read: true,
    },
  ],
  'conv-7': [
    {
      id: 'm7-1', conversationId: 'conv-7', senderId: 'buyer', senderName: 'Li Wei Tan',
      content: 'Hi, is this charger compatible with iPhone 15?', type: 'text', timestamp: '5:00 AM', read: true,
    },
  ],
  'conv-8': [
    {
      id: 'm8-1', conversationId: 'conv-8', senderId: 'buyer', senderName: 'Priya Devi',
      content: 'Okay placed order already! Thanks!', type: 'text', timestamp: 'Yesterday', read: true,
    },
  ],
}

const mockStats: ChatStats = {
  totalConversations: 24,
  unreadMessages: 6,
  avgResponseTime: '3.2 min',
  responseRate: '94%',
}

const aiSuggestions: Record<string, string[]> = {
  'conv-1': ['Yes, it\'s available! 🎉', 'Let me check the stock for you', 'Free shipping today!'],
  'conv-2': ['I can offer 10% off for 10 units', 'Let me create a special bundle price', 'Sure, here\'s a bulk discount code'],
  'conv-3': ['Thank you for the review! 🙏', 'Glad you love it!', 'Check out our new arrivals'],
  'conv-4': ['Restocking next week!', 'I can notify you when it\'s back', 'Similar models available now'],
  'conv-5': ['So sorry! Replacement on the way', 'Return shipping is free', 'I\'ll escalate this immediately'],
  'conv-6': ['Best price RM47 for 2 units ✨', 'Deal! RM45 it is 🤝', 'How about RM46 final price?'],
  'conv-7': ['Yes! Fully MFi certified 👍', 'Works with all iPhone 15 models', 'USB-C compatible too!'],
  'conv-8': ['Thank you for your order! 🎉', 'Your order will ship tomorrow', 'Use code SAVE10 for next order!'],
}

/* ============================================================
   Helper Components
   ============================================================ */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-shopee"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[80%] sm:max-w-[70%]',
          isMine ? 'order-2' : 'order-1'
        )}
      >
        {/* Product Card */}
        {message.type === 'product_card' && message.productInfo && (
          <div
            className={cn(
              'rounded border-2 border-shopee/30 bg-shopee/5 p-3 mb-1',
              'dark:border-shopee/20 dark:bg-shopee/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-shopee/10 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-shopee" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {message.productInfo.name}
                </p>
                <p className="text-sm font-bold text-shopee">
                  {message.productInfo.price}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Card */}
        {message.type === 'order_card' && message.orderInfo && (
          <div
            className={cn(
              'rounded border-2 border-profit/30 bg-profit/5 p-3 mb-1',
              'dark:border-profit/20 dark:bg-profit/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-profit/10 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-profit" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Order #{message.orderInfo.orderId}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {message.orderInfo.status}
                </p>
                <p className="text-sm font-bold text-profit">
                  {message.orderInfo.total}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sticker */}
        {message.type === 'sticker' && (
          <div className="text-4xl mb-1">{message.content}</div>
        )}

        {/* Text bubble */}
        {message.type === 'text' && message.content && (
          <div
            className={cn(
              'px-3.5 py-2.5 text-sm leading-relaxed',
              isMine
                ? 'bg-shopee text-white rounded-l-lg rounded-tr-sm'
                : 'bg-muted text-foreground rounded-r-lg rounded-tl-sm',
              'border-2',
              isMine
                ? 'border-shopee-dark/20'
                : 'border-border'
            )}
          >
            {message.content}
          </div>
        )}

        {/* Image */}
        {message.type === 'image' && (
          <div
            className={cn(
              'rounded border-2 overflow-hidden mb-1',
              isMine ? 'border-shopee-dark/20' : 'border-border'
            )}
          >
            <div className="w-48 h-36 bg-muted flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Timestamp + read status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-[10px] text-muted-foreground',
            isMine ? 'justify-end' : 'justify-start'
          )}
        >
          <span>{message.timestamp}</span>
          {isMine && (
            message.read
              ? <CheckCheck className="w-3 h-3 text-shopee" />
              : <Check className="w-3 h-3" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ============================================================
   Main ChatPage Component
   ============================================================ */

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [offerToggle, setOfferToggle] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null
  const currentMessages = selectedConvId ? (messages[selectedConvId] ?? []) : []

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0)

  // Filter & sort conversations: pinned first, then by time
  const filteredConversations = conversations
    .filter(
      (c) =>
        c.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages.length])

  const handleSelectConversation = useCallback((convId: string) => {
    setSelectedConvId(convId)
    setMobileShowChat(true)
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    )
  }, [])

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !selectedConvId) return

    const newMsg: Message = {
      id: `m-new-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: 'seller',
      senderName: 'You',
      content: messageInput.trim(),
      type: 'text',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }

    setMessages((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] ?? []), newMsg],
    }))

    // Update last message in conversation list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? { ...c, lastMessage: messageInput.trim(), lastMessageTime: 'Just now' }
          : c
      )
    )

    setMessageInput('')

    // Simulate typing response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const buyerReplies = [
        'Okay noted! 👍',
        'Thanks for the info!',
        'Will check it out!',
        'Sounds good! 😊',
        'Can you send me the link?',
        'Great, I\'ll place the order now!',
        'Got it, terima kasih!',
        'Nice one! 🔥',
      ]
      const reply: Message = {
        id: `m-reply-${Date.now()}`,
        conversationId: selectedConvId,
        senderId: 'buyer',
        senderName: selectedConv?.buyerName ?? 'Buyer',
        content: buyerReplies[Math.floor(Math.random() * buyerReplies.length)],
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true,
      }
      setMessages((prev) => ({
        ...prev,
        [selectedConvId]: [...(prev[selectedConvId] ?? []), reply],
      }))
    }, 1500 + Math.random() * 1500)
  }, [messageInput, selectedConvId, selectedConv])

  const handleQuickReply = useCallback(
    (text: string) => {
      setMessageInput(text)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    },
    []
  )

  const handlePinConversation = useCallback((convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, isPinned: !c.isPinned } : c))
    )
  }, [])

  const handleDeleteConversation = useCallback((convId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId))
    if (selectedConvId === convId) {
      setSelectedConvId(null)
      setMobileShowChat(false)
    }
  }, [selectedConvId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage]
  )

  /* ── Conversation List Panel ── */
  const conversationListPanel = (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-shopee/10 text-shopee">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Seller Chat</h2>
              <p className="text-xs text-muted-foreground">Manage buyer conversations</p>
            </div>
          </div>
          {totalUnread > 0 && (
            <Badge className="bg-shopee text-white border-0 hover:bg-shopee-dark">
              {totalUnread} unread
            </Badge>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-2 border-border rounded h-9 text-sm bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      <Separator />

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations found
            </div>
          )}
          {filteredConversations.map((conv, index) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className={cn(
                'flex items-center gap-3 p-3 rounded cursor-pointer transition-colors',
                'hover:bg-shopee/5 dark:hover:bg-shopee/10',
                selectedConvId === conv.id && 'bg-shopee/10 dark:bg-shopee/15 border-l-2 border-shopee',
                conv.isPinned && 'bg-lime/5 dark:bg-lime/5'
              )}
              onClick={() => handleSelectConversation(conv.id)}
            >
              {/* Avatar + Online Dot */}
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10 border-2 border-border rounded">
                  <AvatarFallback className={cn('text-xs font-bold rounded', conv.avatarColor)}>
                    {conv.buyerInitials}
                  </AvatarFallback>
                </Avatar>
                {conv.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {conv.isPinned && <Pin className="w-3 h-3 text-lime-dark shrink-0" />}
                  <span className="text-sm font-semibold text-foreground truncate">
                    {conv.buyerName}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.lastMessage}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] text-muted-foreground">{conv.lastMessageTime}</span>
                {conv.unreadCount > 0 && (
                  <Badge className="bg-shopee text-white text-[10px] px-1.5 py-0 border-0 h-5 min-w-[20px] flex items-center justify-center rounded">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Stats Toggle */}
      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowStats(!showStats)}
        >
          <BarChart3Icon className="w-3.5 h-3.5 mr-1.5" />
          {showStats ? 'Hide' : 'Show'} Chat Stats
        </Button>
      </div>

      {/* Collapsible Stats */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 p-3 pt-0">
              <Card className="p-3 border-2 card-hover">
                <p className="text-lg font-bold text-foreground">{mockStats.totalConversations}</p>
                <p className="text-[10px] text-muted-foreground">Total Chats</p>
              </Card>
              <Card className="p-3 border-2 card-hover">
                <p className="text-lg font-bold text-shopee">{mockStats.unreadMessages}</p>
                <p className="text-[10px] text-muted-foreground">Unread</p>
              </Card>
              <Card className="p-3 border-2 card-hover">
                <p className="text-lg font-bold text-lime-dark">{mockStats.avgResponseTime}</p>
                <p className="text-[10px] text-muted-foreground">Avg Response</p>
              </Card>
              <Card className="p-3 border-2 card-hover">
                <p className="text-lg font-bold text-profit">{mockStats.responseRate}</p>
                <p className="text-[10px] text-muted-foreground">Response Rate</p>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  /* ── Chat Window Panel ── */
  const chatWindowPanel = selectedConv ? (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedConv.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col h-full"
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-border">
          <div className="flex items-center gap-3">
            {/* Mobile back button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileShowChat(false)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="relative">
              <Avatar className="w-9 h-9 border-2 border-border rounded">
                <AvatarFallback className={cn('text-xs font-bold rounded', selectedConv.avatarColor)}>
                  {selectedConv.buyerInitials}
                </AvatarFallback>
              </Avatar>
              {selectedConv.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{selectedConv.buyerName}</h3>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-medium',
                    selectedConv.isOnline
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {selectedConv.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePinConversation(selectedConv.id)}
                >
                  {selectedConv.isPinned ? (
                    <PinOff className="w-4 h-4 text-lime-dark" />
                  ) : (
                    <Pin className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {selectedConv.isPinned ? 'Unpin conversation' : 'Pin conversation'}
              </TooltipContent>
            </Tooltip>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="py-6 space-y-4">
                  <div className="text-center">
                    <Avatar className="w-16 h-16 mx-auto border-2 border-border rounded mb-3">
                      <AvatarFallback className={cn('text-lg font-bold rounded', selectedConv.avatarColor)}>
                        {selectedConv.buyerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-foreground">{selectedConv.buyerName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedConv.isOnline ? '🟢 Online now' : '⚫ Last seen recently'}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => handlePinConversation(selectedConv.id)}
                    >
                      {selectedConv.isPinned ? (
                        <>
                          <PinOff className="w-4 h-4 mr-2" /> Unpin Conversation
                        </>
                      ) : (
                        <>
                          <Pin className="w-4 h-4 mr-2" /> Pin Conversation
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      <Phone className="w-4 h-4 mr-2" /> Call Buyer
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm text-destructive hover:text-destructive"
                      onClick={() => handleDeleteConversation(selectedConv.id)}
                    >
                      <X className="w-4 h-4 mr-2" /> Delete Conversation
                    </Button>
                  </div>

                  <Separator />

                  {/* Offer Toggle */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">Offer Settings</p>
                    <button
                      onClick={() => setOfferToggle(!offerToggle)}
                      className="flex items-center justify-between w-full p-2 rounded border-2 border-border hover:border-shopee/30 transition-colors"
                    >
                      <span className="text-sm text-foreground">Allow Offers</span>
                      {offerToggle ? (
                        <ToggleRight className="w-5 h-5 text-shopee" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <p className="text-[10px] text-muted-foreground">
                      {offerToggle
                        ? 'Buyers can send price negotiations'
                        : 'Price negotiation is disabled'}
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {currentMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isMine={msg.senderId === 'seller'} />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted border-2 border-border rounded-r-lg rounded-tl-sm px-1 py-1">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* AI Suggestions */}
        {selectedConvId && aiSuggestions[selectedConvId] && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Bot className="w-3.5 h-3.5 text-shopee" />
              <span className="text-[10px] font-semibold text-shopee uppercase tracking-wider">
                AI Suggested
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {aiSuggestions[selectedConvId].map((suggestion, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="shrink-0 text-xs px-3 py-1.5 rounded border-2 border-shopee/20 bg-shopee/5 text-shopee hover:bg-shopee/10 dark:bg-shopee/10 dark:hover:bg-shopee/15 dark:border-shopee/30 transition-colors whitespace-nowrap"
                  onClick={() => handleQuickReply(suggestion)}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-3 border-t-2 border-border">
          {offerToggle && selectedConv?.lastMessage.includes('discount') && (
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Badge
                variant="outline"
                className="text-[10px] border-lime/40 text-lime-dark bg-lime/5 cursor-pointer hover:bg-lime/10"
              >
                💰 Make Offer
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Smile className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sticker / Emoji</TooltipContent>
            </Tooltip>

            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-2 border-border rounded h-9 text-sm"
            />

            <motion.div whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}>
              <Button
                size="icon"
                className="h-9 w-9 bg-shopee hover:bg-shopee-dark text-white border-0 rounded shrink-0"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  ) : (
    /* Empty State */
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded bg-shopee/10 text-shopee flex items-center justify-center mb-4"
      >
        <MessageCircle className="w-8 h-8" />
      </motion.div>
      <h3 className="text-lg font-bold text-foreground mb-1">Select a Conversation</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Choose a conversation from the list to start chatting with your buyers
      </p>
    </div>
  )

  /* ── Render ── */
  return (
    <div className="h-full">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-[320px_1fr] h-full border-2 border-border rounded bg-card overflow-hidden">
        <div className="border-r-2 border-border overflow-hidden">
          {conversationListPanel}
        </div>
        {chatWindowPanel}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full border-2 border-border rounded bg-card overflow-hidden">
        {mobileShowChat ? chatWindowPanel : conversationListPanel}
      </div>
    </div>
  )
}

/* ── Inline icon (no import needed for stats button) ── */
function BarChart3Icon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}

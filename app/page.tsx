"use client";

import { useEffect, useState } from "react";
import { PostCard, PostCardSkeleton } from "@/components/post/post-card";
import { CreatePostForm } from "@/components/post/create-post";
import { Separator } from "@/components/ui/separator";
import { Comment, Like, Post, User } from "@prisma/client";
import { createPost, getAllPosts } from "@/lib/actions/post";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface CommentWithUser extends Comment {
  user: User
}

interface PostWithUser extends Post {
  user: Pick<User, 'name' | 'image' | 'id'>
  Like: Like[]
  comment: CommentWithUser[]
}

export default function Feed() {
  const [posts, setPosts] = useState<PostWithUser[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const { data: session } = useSession()

  const handleNewPost = async (content: string) => {
    if (!session?.user) {
      redirect('/signin')
    }

    if (!content) {
      return 'Content required'
    }

    if (session.user.id) {
      const response = await createPost(content, session.user.id)
      console.log("Post created: ", response)
    }
  }

  const onDelete = () => {
    loadPosts()
  }

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await getAllPosts()
      if (response && Array.isArray(response)) {
        const sortedPosts = response.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPosts(sortedPosts as PostWithUser[])
      } else {
        setPosts([])
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts()
  }, [])

  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex min-h-screen w-full flex-col items-center bg-gray-50">
        <CreatePostForm onSuccess={loadPosts} onPostSubmit={handleNewPost} />
        <Separator className="mb-6" />
        {loading ? (
          <PostCardSkeleton />
        ) : (
          <div className="w-full flex flex-col items-center">
            {posts.map((post) => (
              <PostCard key={post.id}
                id={post.id}
                userId={post.userId}
                username={post.user.name ?? '-'}
                avatarUrl={post.user.image ?? 'https://github.com/shadcn.png'}
                content={post.content}
                timestamp={post.createdAt.toISOString()}
                Like={post.Like}
                comment={post.comment}
                onSuccess={loadPosts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
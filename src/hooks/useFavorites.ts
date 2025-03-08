import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

import type { Cat, Favorite } from "../types";

interface SupabaseError {
  message: string;
}

export const useFavorites = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // ユーザーのお気に入りを取得
  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        setError(error.message);
        return [];
      }

      return data as Favorite[];
    },
    enabled: !!user,
  });

  // ユーザーのお気に入り猫のIDリスト
  const favoriteCatIds = favorites?.map((fav) => fav.cat_id) || [];

  // お気に入りの猫情報を取得
  const { data: favoriteCats } = useQuery({
    queryKey: ["favorite-cats", favoriteCatIds],
    queryFn: async () => {
      if (!user || favoriteCatIds.length === 0) return [];

      const { data, error } = await supabase
        .from("cats")
        .select("*")
        .in("id", favoriteCatIds);

      if (error) {
        setError(error.message);
        return [];
      }

      return data as Cat[];
    },
    enabled: !!user && favoriteCatIds.length > 0,
  });

  // お気に入り追加
  const addFavoriteMutation = useMutation({
    mutationFn: async (catId: string) => {
      if (!user) throw new Error("ログインが必要です");

      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, cat_id: catId });

      if (error) throw error;
    },
    onSuccess: () => {
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["favorite-cats"] });
    },
    onError: (error: SupabaseError) => {
      setError(error.message);
    },
  });

  // お気に入り削除
  const removeFavoriteMutation = useMutation({
    mutationFn: async (catId: string) => {
      if (!user) throw new Error("ログインが必要です");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .match({ user_id: user.id, cat_id: catId });

      if (error) throw error;
    },
    onSuccess: () => {
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["favorite-cats"] });
    },
    onError: (error: SupabaseError) => {
      setError(error.message);
    },
  });

  // 特定の猫がお気に入りかどうか
  const isFavorite = (catId: string): boolean => {
    return favoriteCatIds.includes(catId);
  };

  // お気に入りの切り替え
  const toggleFavorite = async (catId: string) => {
    if (!user) {
      setError("ログインが必要です");
      return;
    }

    try {
      if (isFavorite(catId)) {
        await removeFavoriteMutation.mutateAsync(catId);
      } else {
        await addFavoriteMutation.mutateAsync(catId);
      }
    } catch (error) {
      console.error("お気に入り操作エラー:", error);
    }
  };

  return {
    favorites,
    favoriteCats,
    isLoading,
    error,
    isFavorite,
    toggleFavorite,
  };
};

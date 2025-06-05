"use server";

import { CACHE_TAGS } from "@/services/notes";
import { revalidateTag } from "next/cache";

export const revalidateNotes = async () => {
  revalidateTag(CACHE_TAGS.NOTES);
};

export const revalidateNoteDetail = async () => {
  revalidateTag(CACHE_TAGS.NOTE_DETAIL);
};

export const revalidateAboutAllNote = async () => {
  Object.values(CACHE_TAGS).forEach((tag) => {
    revalidateTag(tag);
  });
};

export const getCacheTags = async () => {
  return CACHE_TAGS;
};

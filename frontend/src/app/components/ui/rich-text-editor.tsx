"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/OnChangePlugin";
import { useEffect, useState } from "react";
import { 
  Bold, 
  Italic,
  Underline,
  List, 
  MoreHorizontal,
  ChevronDown,
  Type
} from "lucide-react";

export function RichTextEditor({ content, onChange }: any) {
  return (
    <div className="p-10 bg-white border rounded-xl">
      <h3 className="text-xl font-bold mb-4">Read Only Document</h3>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

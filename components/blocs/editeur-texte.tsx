"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Unlink,
  type LucideIcon,
} from "lucide-react";

/**
 * Éditeur de texte enrichi (WYSIWYG, façon Word) pour le bloc TEXTE.
 * Le HTML produit est synchronisé dans un input caché `name`, soumis avec le
 * reste du formulaire. Le HTML est de toute façon nettoyé côté serveur
 * (lib/sanitize-html.ts) avant d'être stocké, et de nouveau à l'affichage.
 */
export function EditeurTexte({ name }: { name: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[160px] focus:outline-none px-3 py-2",
      },
    },
  });

  if (!editor) return null;

  function classeBouton(actif: boolean) {
    return `rounded-md p-1.5 ${actif ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`;
  }

  function BoutonOutil({
    icon: Icon,
    label,
    actif = false,
    onClick,
  }: {
    icon: LucideIcon;
    label: string;
    actif?: boolean;
    onClick: () => void;
  }) {
    return (
      <button type="button" onClick={onClick} className={classeBouton(actif)} aria-label={label} title={label}>
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  function gererLien() {
    const url = window.prompt("Adresse du lien (https://...)");
    if (url === null) return;
    if (!url.trim()) {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="rounded-md border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-1.5">
        <BoutonOutil icon={Bold} label="Gras" actif={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <BoutonOutil icon={Italic} label="Italique" actif={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <BoutonOutil icon={UnderlineIcon} label="Souligné" actif={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <BoutonOutil icon={Heading2} label="Titre" actif={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <BoutonOutil icon={Heading3} label="Sous-titre" actif={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <BoutonOutil icon={List} label="Liste à puces" actif={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <BoutonOutil icon={ListOrdered} label="Liste numérotée" actif={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <BoutonOutil icon={Quote} label="Citation" actif={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <BoutonOutil icon={Link2} label="Insérer un lien" actif={editor.isActive("link")} onClick={gererLien} />
        {editor.isActive("link") && (
          <BoutonOutil icon={Unlink} label="Retirer le lien" onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()} />
        )}
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={editor.getHTML()} readOnly />
    </div>
  );
}

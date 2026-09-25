import type { Block, Work } from "@/lib/works";
import { PromptBlock } from "@/components/PromptBlock";

// Paragraph and list HTML is escaped by build_works.py; only <code> and <a> survive from the note.
function NoteBlock({ block }: { block: Block }) {
  if (block.type === "prompt") return <PromptBlock text={block.text} />;
  if (block.type === "p") return <p dangerouslySetInnerHTML={{ __html: block.html }} />;
  const List = block.type;
  return <List>{block.items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}</List>;
}

export function NoteSections({ notes }: { notes: NonNullable<Work["notes"]> }) {
  if (!notes.length) return <p className="fine-print">制作笔记整理中。</p>;
  return notes.map((section) => (
    <section className="note-section" key={section.name}>
      <h2>{section.name}</h2>
      {section.blocks.map((block, i) => <NoteBlock key={i} block={block} />)}
    </section>
  ));
}

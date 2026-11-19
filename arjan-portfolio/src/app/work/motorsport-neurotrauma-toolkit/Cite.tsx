import { sources, type SourceId } from "@/content/neurotrauma";
import styles from "./neurotrauma.module.css";

export function Cite({ id }: { id: SourceId }) {
  const source = sources[id];
  return <a className={styles.citation} href={source.url} title={`${source.title} · ${source.locator}`}>[{source.label}]</a>;
}

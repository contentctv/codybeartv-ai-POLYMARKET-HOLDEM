import { TIP_JAR_URL } from "../../lib/tip-jar";

export default function TipPage() {
  return (
    <section className="panel">
      <p className="kicker">Tip rail</p>
      <h1>Bitcoin Jungle</h1>
      <p>One payee. The link leaves this shell and opens the CodyBearTV tip jar.</p>
      <p className="url">{TIP_JAR_URL}</p>
      <a className="tip" href={TIP_JAR_URL} rel="noreferrer noopener" target="_blank">
        Tip CodyBearTV
      </a>
    </section>
  );
}

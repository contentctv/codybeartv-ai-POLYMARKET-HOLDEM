const PLACEHOLDER_PROJECT_ID = "REPLACE_ME";

type Namespace = {
  chains: string[];
  methods: string[];
  events: string[];
};

type SessionStruct = {
  topic: string;
  namespaces: Record<string, { accounts?: string[] } | undefined>;
};

type SignLike = {
  connect: (params: {
    requiredNamespaces: Record<string, Namespace>;
  }) => Promise<{ uri?: string; approval: () => Promise<SessionStruct> }>;
  disconnect: (params: {
    topic: string;
    reason: { code: number; message: string };
  }) => Promise<void>;
};

type SignCtor = {
  init: (opts: {
    projectId: string;
    metadata: { name: string; description: string; url: string; icons: string[] };
  }) => Promise<SignLike>;
};

type ModalLike = {
  openModal: (options: { uri: string }) => void | Promise<void>;
  closeModal: () => void;
};

type ModalCtor = new (opts: {
  projectId: string;
  themeMode?: "dark" | "light";
  themeVariables?: Record<string, string>;
}) => ModalLike;

type LiveSession = {
  topic: string;
  address: string;
};

let signClient: SignLike | null = null;
let modal: ModalLike | null = null;
let live: LiveSession | null = null;

export function truncatedAddress(address: string): string {
  const bare = address.split(":").pop()?.trim() ?? "";
  if (bare.length <= 10) return bare;
  return `${bare.slice(0, 6)}…${bare.slice(-4)}`;
}

function projectId(): string {
  return process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
}

function assertReady(id: string): void {
  if (!id || id === PLACEHOLDER_PROJECT_ID) {
    throw new Error("Set NEXT_PUBLIC_WC_PROJECT_ID before connecting.");
  }
  if (typeof window === "undefined") {
    throw new Error("Open a session from the browser.");
  }
}

async function loadSignCtor(): Promise<SignCtor> {
  const mod = (await import("@walletconnect/sign-client")) as {
    default?: SignCtor;
    SignClient?: SignCtor;
  };
  const ctor = mod.default ?? mod.SignClient;
  if (!ctor) throw new Error("WalletConnect session client is unavailable.");
  return ctor;
}

async function loadModalCtor(): Promise<ModalCtor> {
  const mod = (await import("@walletconnect/modal")) as {
    default?: ModalCtor;
    WalletConnectModal?: ModalCtor;
  };
  const ctor = mod.WalletConnectModal ?? mod.default;
  if (!ctor) throw new Error("WalletConnect modal is unavailable.");
  return ctor;
}

async function getSign(id: string): Promise<SignLike> {
  if (!signClient) {
    const ctor = await loadSignCtor();
    signClient = await ctor.init({
      projectId: id,
      metadata: {
        name: "CodyBearTV Member",
        description: "Member shell. Connect and disconnect only.",
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.ico`],
      },
    });
  }
  return signClient;
}

async function getModal(id: string): Promise<ModalLike> {
  if (!modal) {
    const Ctor = await loadModalCtor();
    modal = new Ctor({
      projectId: id,
      themeMode: "dark",
      themeVariables: {
        "--wcm-accent-color": "#1FA6A0",
        "--wcm-background-color": "#042F2E",
      },
    });
  }
  return modal;
}

export async function connect(): Promise<{ address: string; truncated: string }> {
  const id = projectId();
  assertReady(id);
  const sign = await getSign(id);
  const ui = await getModal(id);
  const { uri, approval } = await sign.connect({
    requiredNamespaces: {
      eip155: {
        chains: ["eip155:1"],
        methods: ["eth_accounts"],
        events: ["accountsChanged"],
      },
    },
  });
  let opened = false;
  try {
    if (uri) {
      await Promise.resolve(ui.openModal({ uri }));
      opened = true;
    }
    const session = await approval();
    const accounts = session.namespaces.eip155?.accounts ?? [];
    const address = accounts[0] ?? "";
    if (!address) throw new Error("Session returned no account.");
    live = { topic: session.topic, address };
    return { address, truncated: truncatedAddress(address) };
  } finally {
    if (opened) ui.closeModal();
  }
}

export async function disconnect(): Promise<void> {
  if (!live) return;
  const id = projectId();
  assertReady(id);
  const topic = live.topic;
  live = null;
  const sign = await getSign(id);
  await sign.disconnect({
    topic,
    reason: { code: 6000, message: "User disconnected" },
  });
}

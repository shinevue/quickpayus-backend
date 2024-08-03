interface AdminConfig {
  adminId: string;
  action: string;
  newAddress: string;
}

interface Config {
  adminAddress: AdminConfig;
}

const config: Config = {
  adminAddress: {
    adminId: "admin",
    action: "Add",
    newAddress: "TCCh4m1Hadmin3bd5AbXFfAriWEndFzSvY",
  },
};

export default config;

interface AdminConfig {
  adminId: string;
  action: string;
  newAddress: string;
}

interface Config {
  adminAddress: AdminConfig;
  profitConfig: any
}

const config: Config = {
  adminAddress: {
    adminId: "admin",
    action: "Add",
    newAddress: "TCCh4m1Hadmin3bd5AbXFfAriWEndFzSvY",
  },
  profitConfig: {
    userId: "admin",
    profit: [2, 3, 4, 5, 6]
  }
};

export default config;

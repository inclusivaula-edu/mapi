import mercadopago from 'mercadopago';

const { MercadoPagoConfig, Preference } = mercadopago;

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export const preferenceClient = new Preference(client);
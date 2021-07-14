import Mpesa from "./index";

test("two plus two is four", () => {
  expect(2 + 2).toBe(4);
});

const mpesa = new Mpesa({
  ConsumerKey: "",
  ConsumerSecret: "",
  isSandBox: true,
  PassKey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  InitiatorName: "testapi",
  SecurityCredential: "Safaricom147!",
  Shortcode: 600147,
  OnlineShortcode: 174379,
});

mpesa._getAuthToken();

mpesa
  .sktPush({
    Amount: 1,
    PhoneNumber: 2540000000,
    AccountReference: "Invoice-001",
    TransactionDesc: "Test",
    CallBackUrl: "http://testing.com/sum",
  })
  .then((result) => console.log(result))
  .catch((error) => console.error(error));

mpesa
  .stkCheck("ws_CO_150720210003506127")
  .then((result) => console.log(result))
  .catch((error) => console.error(error));

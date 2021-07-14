import axios from "axios";

interface initialProps {
  ConsumerKey: string;
  ConsumerSecret: string;
  isSandBox: boolean;
  PassKey: string;
  InitiatorName: string;
  SecurityCredential: string;
  Shortcode: number;
  OnlineShortcode: number;
}
interface stkPushProps {
  Amount: number;
  PhoneNumber: number;
  AccountReference: string;
  TransactionDesc: string;
  CallBackUrl: string;
}

class Mpesa {
  ConsumerKey: string;
  ConsumerSecret: string;
  PassKey: string;
  InitiatorName: string;
  SecurityCredential: string;
  Shortcode: number;
  OnlineShortcode: number;
  isSandBox: boolean;
  _accessToken: string;
  _rootEndPoint: string;
  _authUrl: string;
  constructor({
    ConsumerKey,
    ConsumerSecret,
    isSandBox,
    PassKey,
    InitiatorName,
    SecurityCredential,
    Shortcode,
    OnlineShortcode,
  }: initialProps) {
    this._accessToken = "";
    this.ConsumerKey = ConsumerKey;
    this.ConsumerSecret = ConsumerSecret;
    this.isSandBox = isSandBox;
    this.PassKey = PassKey;
    this.Shortcode = Shortcode;
    this.InitiatorName = InitiatorName;
    this.SecurityCredential = SecurityCredential;
    this.OnlineShortcode = OnlineShortcode;

    isSandBox
      ? (this._rootEndPoint = "https://sandbox.safaricom.co.ke")
      : (this._rootEndPoint = "https://sandbox.safaricom.co.ke");

    this._authUrl = `${this._rootEndPoint}/oauth/v1/generate?grant_type=client_credentials`;
  }
  async _getAuthToken() {
    try {
      // ConsumerKey:ConsumerSecret
      const combinedKeys = this.ConsumerKey + ":" + this.ConsumerSecret;

      // create a buffer of the combined Keys (ConsumerKey:ConsumerSecret)
      const buffKeys = await Buffer.from(combinedKeys, "utf-8");

      // Convert the combined Keys Buffer to Base64
      const base64Keys = await buffKeys.toString("base64");

      // Make Api call to the auth url with the Base64 Keys as the token
      const result = await axios.get(this._authUrl, {
        headers: {
          Authorization: `Basic ${base64Keys}`,
        },
      });

      const { access_token } = result.data;

      return access_token;
    } catch (error) {
      console.log("error");
    }
  }
  pad2(n: any) {
    return n < 10 ? "0" + n : n;
  }

  async _setHeaders() {
    let access_token = await this._getAuthToken();
    axios.defaults.headers = {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    };
  }

  _generateTimeStamp(): string {
    var date = new Date();
    return (
      date.getFullYear().toString() +
      this.pad2(date.getMonth() + 1) +
      this.pad2(date.getDate()) +
      this.pad2(date.getHours()) +
      this.pad2(date.getMinutes()) +
      this.pad2(date.getSeconds())
    );
  }

  _generatePassword(): string {
    let Timestamp = this._generateTimeStamp();
    return Buffer.from(
      this.OnlineShortcode + this.PassKey + Timestamp
    ).toString("base64") as string;
  }

  // Lipa Na M-Pesa Online Payment API
  // Use this API to initiate online payment on behalf of a customer.

  sktPush(stkPushProps: stkPushProps) {
    const {
      Amount,
      PhoneNumber,
      AccountReference,
      TransactionDesc,
      CallBackUrl,
    } = stkPushProps;

    return new Promise(async (resolve, reject) => {
      if (!Amount) reject(new Error("Must provide an amount"));
      if (!PhoneNumber) reject(new Error("Must provide a PhoneNumber"));
      if (!AccountReference)
        reject(new Error("Must provide an AccountReference"));
      if (!TransactionDesc) reject(new Error("Must provide a TransactionDesc"));
      if (!CallBackUrl) reject(new Error("Must provide a TransactionDesc"));

      await this._setHeaders();

      var Timestamp = this._generateTimeStamp();
      var Password = this._generatePassword();

      let requestBody = {
        BusinessShortCode: this.OnlineShortcode,
        TransactionType: "CustomerPayBillOnline",
        PartyB: this.OnlineShortcode,
        CallBackURL: CallBackUrl,
        Amount,
        PartyA: PhoneNumber,
        PhoneNumber,
        AccountReference,
        TransactionDesc,
        Timestamp,
        Password,
      };

      let data = JSON.stringify(requestBody);

      try {
        axios({
          method: "POST",
          url: `${this._rootEndPoint}/mpesa/stkpush/v1/processrequest`,
          data,
        })
          .then((res: any) => {
            resolve(res.data);
          })
          .catch((error: any) => {
            reject(error.response.data);
          });
      } catch (error) {
        reject(error.response.data);
      }
    });
  }
  // Lipa Na M-Pesa Query Request API
  // Use this API to check the status of a Lipa Na M-Pesa Online Payment.

  stkCheck(CheckoutRequestID: string) {
    return new Promise(async (resolve, reject) => {
      if (!CheckoutRequestID)
        reject(new Error("Must provide an CheckoutRequestID"));

      let headers = await this._setHeaders();

      let requestBody = {
        BusinessShortCode: this.OnlineShortcode,
        CheckoutRequestID,
        Timestamp: this._generateTimeStamp(),
        Password: this._generatePassword(),
      };
      let data = JSON.stringify(requestBody);

      try {
        axios({
          method: "POST",
          url: `${this._rootEndPoint}/mpesa/stkpushquery/v1/query`,
          data,
        })
          .then((res: any) => {
            resolve(res.data);
          })
          .catch((error: any) => {
            reject(error.response.data);
          });
      } catch (error) {
        reject(error.response.data);
      }
    });
  }
}

export default Mpesa;

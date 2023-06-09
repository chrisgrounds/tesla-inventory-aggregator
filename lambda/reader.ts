import { Handler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

type InventoryData = {
  adl_opts: string;
  autopilot: string;
  battery: string;
  city: string;
  decor: string;
  drive: string;
  damage_disclosure: string;
  discount: string;
  eta_to_delivery: string;
  interior: string;
  inventory_price: string;
  model: string;
  odometer: string;
  odometer_type: string;
  on_configurator_price_percentage: string;
  paint: string;
  price: string;
  purchase_price: string;
  trim: string;
  total_price: string;
  trim_name: string;
  warranty_battery_exp_date: string;
  warranty_battery_is_expired: string;
  warranty_mile: string;
  warranty_vehicle_exp_date: string;
  warranty_vehicle_is_expired: string;
  warranty_year: string;
  year: string;
  is_range_standard: string;
};

const createInventoryApi = (model: string) => `https://www.tesla.com/inventory/api/v1/inventory-results?query=%7B%22query%22%3A%7B%22model%22%3A%22${model}%22%2C%22condition%22%3A%22used%22%2C%22options%22%3A%7B%7D%2C%22arrangeby%22%3A%22Price%22%2C%22order%22%3A%22asc%22%2C%22market%22%3A%22GB%22%2C%22language%22%3A%22en%22%2C%22super_region%22%3A%22north%20america%22%2C%22lng%22%3A-1.5151%2C%22lat%22%3A54.5554%2C%22zip%22%3A%22DL1%22%2C%22range%22%3A0%2C%22region%22%3A%22ON%22%7D%2C%22offset%22%3A0%2C%22count%22%3A50%2C%22outsideOffset%22%3A0%2C%22outsideSearch%22%3Afalse%7D`;

const stripModelNames = (str: string) => 
  str.replace(/\bModel (3|Y|X|S)\b/g, '');

const prettyModels: Record<string, string> = {
  "ms": "Model S",
  "m3": "Model 3",
  "mx": "Model X",
  "my": "Model Y",
};

const buildListItem = (item: InventoryData) =>
  `<tr><td style="padding:10px 20px;">${prettyModels[item.model]} (${stripModelNames(item.trim_name)})</td><td style="padding:10px 20px;">${item.year}</td><td style="padding:10px 20px;">£${item.total_price}</td></tr>`;

const buildEmailBody = (inventory: InventoryData[]) => {
  return `
  <html>
    <body>
      <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top">
              <table border="0" cellpadding="20" cellspacing="0" width="600" id="emailContainer">
                  <tr>
                      <td align="center" valign="top">
                          <table border="0" cellpadding="20" cellspacing="0" width="100%" id="emailHeader">
                              <tr>
                                  <td align="center" valign="top">
                                    <h1>Tesla Inventory</h1>
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                      <td align="center" valign="top">
                          <table border="0" cellpadding="20" cellspacing="0" width="100%" id="emailBody">
                              <tr>
                                <td align="center" valign="top">
                                  <table style="border-collapse:collapse">
                                    <thead style="background:#009879">
                                      <tr style="background:#009879">
                                        <th style="padding:10px 20px;"><font style="font-size:14px" color="white">Model</font></th>
                                        <th style="padding:10px 20px;"><font style="font-size:14px" color="white">Year</font></th>
                                        <th style="padding:10px 20px;"><font style="font-size:14px" color="white">Price</font></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${inventory.map(buildListItem).join('')}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                      <td align="center" valign="top">
                          <table border="0" cellpadding="20" cellspacing="0" width="100%" id="emailFooter">
                              <tr>
                                  <td align="center" valign="top">
                                      <p>Thanks for reading!</p>
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
              </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

const getInventoryData = async (model: string) => {
  const res = await fetch(createInventoryApi(model), {
      "headers": {},
      "method": "GET",
      "mode": "cors",
    });

    const inventory = await res.json();

    const top5Cheapest: InventoryData[] = inventory
      .results
      .sort((a: { price: number; }, b: { price: number; }) => a.price - b.price)
      .slice(0, 5)
      .reduce((acc: InventoryData[], curr: any) =>
      ([
        ...acc,
        {
          adl_opts: curr.ADL_OPTS,
          autopilot: curr.AUTOPILOT,
          battery: curr.BATTERY,
          city: curr.City,
          decor: curr.DECOR,
          drive: curr.DRIVE,
          damage_disclosure: curr.DamageDisclosure,
          discount: curr.Discount,
          eta_to_delivery: curr.EtaToDelivery,
          interior: curr.INTERIOR,
          inventory_price: curr.InventoryPrice,
          model: curr.Model,
          odometer: curr.Odometer,
          odometer_type: curr.OdometerType,
          on_configurator_price_percentage: curr.OnConfiguratorPricePercentage,
          paint: curr.PAINT,
          price: curr.Price,
          purchase_price: curr.PurchasePrice,
          trim: curr.TRIM,
          total_price: curr.TotalPrice,
          trim_name: curr.TrimName,
          warranty_battery_exp_date: curr.WarrantyBatteryExpDate,
          warranty_battery_is_expired: curr.WarrantyBatteryIsExpired,
          warranty_mile: curr.WarrantyMile,
          warranty_vehicle_exp_date: curr.WarrantyVehicleExpDate,
          warranty_vehicle_is_expired: curr.WarrantyVehicleIsExpired,
          warranty_year: curr.WarrantyYear,
          year: curr.Year,
          is_range_standard: curr.IsRangeStandard,
        }
      ]), []);

    return top5Cheapest;
}

export const handler: Handler = async (_event, _context) => {
  try {
    const modelS = await getInventoryData("ms");
    const model3 = await getInventoryData("m3");
    const modelX = await getInventoryData("mx");
    const modelY = await getInventoryData("my");

    const top5Cheapest = [...modelS, ...model3, ...modelX, ...modelY]
      .sort((a: InventoryData, b: InventoryData) => Number(a.price) - Number(b.price))
      .slice(0, 5);

    const dynamodb = new DynamoDBClient({ region: "eu-west-2" });

    const ses = new SESClient({ region: "eu-west-2" });

    const putItem = new PutItemCommand({
      TableName: "cheapest_tesla_inventory",
      Item: {
        Id: { "S": uuidv4() },
        Model: { "S": prettyModels[top5Cheapest[0].model] },
        Price: { "S": top5Cheapest[0].price.toString()},
        Date: { "S": new Date().toISOString() },
      }
    });

    await dynamodb.send(putItem);

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [process.env.TO_ADDR || ""],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: buildEmailBody(top5Cheapest)
          },
        },
        Subject: { Data: `Tesla Inventory Aggregation` },
      },
      Source: process.env.SOURCE_ADDR || "",
    });

    console.log("Sending email");
    await ses.send(command);
  } catch (err) {
    console.log(err);
  }
};

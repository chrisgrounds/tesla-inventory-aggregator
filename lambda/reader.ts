import { Handler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export const handler: Handler = async (event, context) => {
  try {
    const res = await fetch("https://www.tesla.com/inventory/api/v1/inventory-results?query=%7B%22query%22%3A%7B%22model%22%3A%22ms%22%2C%22condition%22%3A%22used%22%2C%22options%22%3A%7B%7D%2C%22arrangeby%22%3A%22Price%22%2C%22order%22%3A%22asc%22%2C%22market%22%3A%22GB%22%2C%22language%22%3A%22en%22%2C%22super_region%22%3A%22north%20america%22%2C%22lng%22%3A-1.5151%2C%22lat%22%3A54.5554%2C%22zip%22%3A%22DL1%22%2C%22range%22%3A0%2C%22region%22%3A%22ON%22%7D%2C%22offset%22%3A0%2C%22count%22%3A50%2C%22outsideOffset%22%3A0%2C%22outsideSearch%22%3Afalse%7D", {
      "headers": {},
      "method": "GET",
      "mode": "cors",
    });

    const inventory = await res.json();

    const sortedInventory = inventory.results.sort((a, b) => a.price - b.price);
    const top5Cheapest = sortedInventory.slice(0, 5).reduce((acc, curr) =>
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

    const ses = new SESClient({ region: "eu-west-2" });

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [process.env.TO_ADDR],
      },
      Message: {
        Body: {
          Text: { Data: "Hello from lambda" },
        },
        Subject: { Data: "Hello from lambda" },
      },
      Source: process.env.SOURCE_ADDR,
    });

    try {
      console.log("Sending email");
      await ses.send(command);
    }
    catch (error) {
      console.log(error);
    }
  } catch (err) {
    console.log(err);
  }
};

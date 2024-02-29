const puppeteer = require("puppeteer");
require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
const scrapper = async () => {
  const browser = await puppeteer.launch({
    headless: true, args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  })
  const page = await browser.newPage()
  await page.goto('https://www.touch.com.lb/autoforms/portal/touch/onlinereservation', { waitUntil: 'networkidle2', timeout: 0 });
  await Promise.all([
    page.waitForNavigation(),
    await page.$eval('#id1', el => el.value = 0),
    // await page.$eval('#num2', el => el.value = 3),
    page.click("#numbers > input[type=button]:nth-child(10)"),
    page.setViewport({
      width: 1000,
      height: 1000,
      deviceScaleFactor: 1
    })

  ]);
  var nums = await page.evaluate(() => { return Array.from(document.querySelectorAll("#available-Numbers > div > select > option")).map(x => x.text) });
  async function numbersFilter() {
    if (localStorage.getItem("nums") != null) {
      storedNumbers = JSON.parse(localStorage.getItem("nums"));
      for (i of nums) {
        if (!storedNumbers.includes(i)) {
          newNumbers.push(i);
          storedNumbers.push(i)

        }
      }
      localStorage.setItem("nums", JSON.stringify(storedNumbers));
    } else {
      newNumbers = nums;
      storedNumbers = nums;
      localStorage.setItem("nums", JSON.stringify(storedNumbers));


    }
  }
  await numbersFilter()

  await browser.close()
  if (newNumbers.length > 0) {
    await sendNotifications()

  }


}
const sendNotifications = async () => {
  let c = 0
  var list = rearrangeNumbers(newNumbers);
  if (newNumbers.length > 0) {

    if (list.length > 30) {
      for (let i = 0; i < list.length; i += 30) {
        const chunk = list.slice(i, i + 30);

        // Perform an action on the chunk
        // bot.sendMessage(ratebChatID, chunk.join(' '));
        // bot.sendMessage(user, chunk.join(' '));
        // bot.sendMessage(me, 'nasser');

      }
    }
    const remaining = list.slice((Math.floor(list.length / 30)) * 30);
    if (remaining.length > 0) {
      // Perform an action on the remaining elements
      // bot.sendMessage(ratebChatID, remaining.join(' '));
      // bot.sendMessage(user, remaining.join(' '));
    }
  }

  console.log(list)


}



function rearrangeNumbers(numbers) {
  const nums = numbers.map(Number);

  nums.sort((a, b) => a - b);

  let prevNum = nums[0];
  let currGroup = [prevNum];
  let groups = [currGroup];

  for (let i = 1; i < nums.length; i++) {
    const currNum = nums[i];
    const diff = currNum - prevNum;

    if (diff <= 1) {
      currGroup.push(currNum);
    } else {
      currGroup = [currNum];
      groups.push(currGroup);
    }

    prevNum = currNum;
  }

  const result = groups.reduce((acc, group) => acc.concat(group), []);

  return result
}

const executeScrapper = async () => {
  for (; true;) {
    await scrapper()
  }
}
executeScrapper();
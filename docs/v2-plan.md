# Stationery Inventory: plan for v2

v1 does the core task: create places, log items with a name, type, place and state, and browse them as tabs. Isha tried it on my laptop on November 17, 2026, before class. v2 is shown at the fair on December 1.

## What I saw

My notes from Isha's test, as I wrote them:

- typing in all the names was quite manual, it would be nice to add a list of recognized/known products and have autocomplete for the product she is typing or somehow smartly recognize what it is
- it would also be nice to add a feature where we take pictures of products and then can recognize what products are in the picture and put them all in an environment
- adding attributes like color/size for pen or ruling/size for notebook would be good
- also adding a quantity field would be good
- the design was good, relatively straightforward, minimal buttons to click through to add a product

## What stays

The design, and the short path to adding a product. Isha found it straightforward, with few clicks. Every v2 addition has to keep that path short: new fields are optional or filled in for you, so adding an item never turns into a long form.

## What I'll change first

**Typing every name by hand.** This was Isha's first note. As you type a name, v2 suggests products it already knows, such as "Mnemosyne A5 Spiral". Picking a suggestion fills in the name, the type and the details below. The suggestions come from a starter list of common stationery, plus everything you've already logged.

## What I'll add

1. **Details for each type.** This was already planned for v2, and Isha asked for it: colour and size for pens, ruling and size for notebooks, and the matching details for pencils and highlighters. Known products fill these in.
2. **Quantity.** Three of the same pen become one item with a count of 3, not three rows. Isha stocks up on purpose, as the proposal interview found, so the count matters more than a warning.
3. **"Do I already have this?"** Before you buy, look a product up and see how many you have and where each one is ("2 like this: 1 on your bookshelf, 1 in your bag"). Known products and details make the match reliable.
4. **"Move to…" with its animation**, illustrated places and the bag-opening animation. My project's focus is Design, so motion is where v2 should feel most like the game inventory in the proposal.
5. **Feel ratings**: my own scores for how a pen writes or how a notebook's paper feels.

The order of work: details and quantity first, because they change the data model and the other features read them. Then autocomplete and "Do I already have this?", then "Move to…" and the animations, then ratings.

## What waits

**Recognising products from a photo.** This was Isha's second note: take a picture of your stash, and the app works out what's in it and puts every item in a place. It's the biggest idea from the test. It needs the known-product list first, to match what it sees against. It would also mean calling a vision model, which brings cost limits with it. My call is that it waits until after the known-product list works, and it's the first thing I'd try after v2.

## Small fixes carried over from v1

From v1's code review, things a person could hit:

- Clicking another item while the add form is open throws away what you typed. v2 asks first.
- "Sign in again", after a session ends, loses the values you'd typed.
- If something was deleted on another device, saving it says "Couldn't save. Try again." forever. v2 says it changed somewhere else and reloads.

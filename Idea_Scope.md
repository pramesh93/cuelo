# **IDEA LOCK · Build Sprint**

## **The idea, in one line**

**AI that listens to my sales call and tells me what to say next in 3 bullets.**

## **Why me**

I have been in B2B SaaS sales for the last 6 years across Atlassian, Salesforce and BrowserStack.

I spend a large part of my job speaking with prospects and customers—discovery calls, demos, POCs, negotiations, objections and account conversations.

I have personally been in situations where a customer asks something unexpected, raises an objection, mentions a competitor or challenges the value/price, and I have only a few seconds to decide how to respond.

I also know other salespeople who can test this privately with me.

My advantage is simple: **I am the user. I have spent years inside this workflow and can immediately tell whether the suggestions are useful or generic.**

---

# **GOAL**

## **The one goal they hire it for**

**Help me respond better during a live customer conversation without stopping to think, search or ask someone for help.**

The primary value is **money** because better conversations can help progress and close deals.

There is also a strong **confidence/status** benefit: I want to sound prepared even when the customer takes the conversation somewhere unexpected.

---

## **Delta 4**

### **Today**

**1\. Listen**

Customer says something or asks a question.

**2\. Think**

I quickly try to understand what they actually mean and what I should say.

**3\. Search / improvise**

If I know the answer, I respond from experience.

If I don't, I improvise, search notes, message someone internally, promise to come back later, or give a weak answer.

**4\. Respond**

I say whatever I can come up with in those few seconds.

### **With my product**

**1\. Listen**

The AI listens to the customer with me.

**2\. Understand**

It understands the latest question, objection or concern in the context of the conversation.

**3\. Suggest**

Within a few seconds, I see **3 short bullets** telling me how I could respond.

**4\. Respond**

I glance at the bullets and answer naturally in my own words.

So the product reduces:

**Listen → think → search/improvise → respond**

to:

**Listen → glance → respond.**

---

## **The sin it rides**

**Fear / insecurity.**

Salespeople don't want to look unprepared in front of customers.

When someone asks a difficult question on a live call, I want something beside me saying:

> **Here's how you can handle this.**

---

# **USER**

## **The trigger**

The user is a **B2B salesperson on a live customer/prospect call**.

The pain hits when the customer:

* asks a difficult question;  
* raises an objection;  
* compares competitors;  
* challenges pricing;  
* describes a problem the rep doesn't fully understand;  
* asks about an unfamiliar capability;  
* or says something where the salesperson isn't sure what to ask next.

The exact moment is:

> **The customer finishes speaking and I have only a few seconds to respond.**

---

## **Today's path, step by step**

1. Customer says something unexpected.  
2. I listen and try to understand what they really mean.  
3. I mentally search through what I know.  
4. I may look through notes or documentation.  
5. I may message a solutions engineer or colleague.  
6. I may give a generic response.  
7. I may say, “Let me check and come back to you.”  
8. Sometimes I simply improvise.

Or I don't solve it at all.

I move the conversation forward without giving the best possible response and realize afterwards:

> **“I should have said/asked that.”**

---

## **Who they trust on this decision**

Salespeople currently trust:

* their own experience;  
* managers;  
* experienced AEs;  
* sales engineers / solution engineers;  
* internal product experts;  
* sales playbooks;  
* product documentation;  
* tools such as ChatGPT before or after calls.

For my product to be trusted **during the call**, suggestions have to be:

**fast \+ short \+ relevant \+ accurate.**

A beautiful answer appearing 20 seconds later is useless.

Three useful bullets appearing while I still have time to respond are valuable.

---

## **Would they pay?**

Yes, sales teams already pay for sales intelligence, conversation intelligence, call recording, coaching and AI sales tools.

But the pricing hypothesis for my product needs to be tested.

My starting guess:

**₹999/month per salesperson**

or roughly:

**\$10–15/user/month.**

For the sprint I care less about proving the perfect price and more about answering:

> **Would a salesperson actually use this during a real call, and would they miss it if I took it away?**

---

# **PRODUCT**

## **Onboarding**

The first experience should require almost no setup.

### **Step 1**

User opens the product.

### **Step 2**

They click:

> **Start Copilot**

### **Step 3**

The product starts listening.

### **Step 4**

Someone says:

> “Your competitor is 30% cheaper. I don't understand why we should pay more for your product.”

Within a few seconds, the salesperson sees:

**Suggested response**

* Don't defend the price immediately—find out whether price is actually the deciding factor.  
* Ask: “If pricing were equal, what would make you choose between the two products?”  
* Use their answer to move the discussion from price to business value and differentiation.

The user should understand the entire product within **one conversation**.

---

## **The core loop**

### **User story 1**

As a salesperson, I click one button before my customer conversation and the copilot starts listening.

### **User story 2**

As a salesperson, when the customer asks a question or raises an objection, I see a useful response within a few seconds.

### **User story 3**

As a salesperson, I receive **only three short bullets**, so I can glance at them without losing attention on the call.

### **User story 4**

As a salesperson, the suggestions change as the conversation changes rather than treating every sentence independently.

### **User story 5**

As a salesperson, I use the suggestion as guidance and respond naturally rather than reading an AI-generated paragraph to the customer.

The core loop is:

**Customer speaks → AI understands → 3 bullets appear → I respond → conversation continues.**

---

## **Coming back**

I use it on every important customer call.

Over time, the product could understand:

* what I sell;  
* my product capabilities;  
* pricing;  
* competitors;  
* common objections;  
* previous customer conversations;  
* my preferred sales style.

That should make its suggestions increasingly specific.

But this is **not required for the first Build Sprint version**.

---

## **The AI-first part**

AI is the **core loop**.

The product has to simultaneously understand:

**speech \+ conversation context \+ customer intent \+ objection/question \+ useful next response.**

This isn't:

> record call → summarize afterwards.

The value exists **while the conversation is happening**.

The critical technical metric is therefore:

> **How quickly can useful bullets appear after the customer finishes speaking?**

For the sprint, I want to test whether:

**live audio → transcript → useful 3-bullet response**

can happen quickly enough that I can actually use the answer before I need to speak.

---

# **MARKET**

## **Tailwinds**

Sales calls are already becoming AI-assisted.

Companies pay for:

* conversation intelligence;  
* call recording/transcription;  
* sales coaching;  
* AI SDRs;  
* meeting assistants;  
* sales enablement;  
* real-time battlecards and objection handling.

AI models are also becoming fast enough for real-time speech and reasoning, which makes assistance **during the conversation** increasingly practical rather than limiting AI to before/after the call.

The timing hypothesis is:

> **Sales AI has spent years analyzing what happened after calls. The next opportunity is helping the salesperson while the conversation is actually happening.**

---

## **Competitors**

This is **not an empty category**.

Products already exist around real-time sales assistance, conversation intelligence and live coaching.

That means:

> **“AI listens to sales calls” is not enough differentiation.**

For the sprint, I want to learn whether the extremely simple interaction:

> **Customer speaks → salesperson gets exactly 3 useful bullets**

is fast and useful enough to become something salespeople genuinely keep open during calls.

The flows I want to study from competitors are:

* how they capture live call audio;  
* how quickly suggestions appear;  
* how much text they show;  
* whether suggestions are generic or product-specific;  
* how they handle objections;  
* whether the rep needs to interact with the UI during the call;  
* whether they work across Zoom/Meet/Teams or require a specific meeting platform.

I have **not yet captured competitor screenshots**, so I should not pretend this section is complete. That is a research task before I build the UI.

---

## **Size and fit**

For the sprint, my user is:

> **B2B salespeople who regularly speak with prospects/customers over video or voice calls.**

This is significantly closer to my network than my previous HubSpot implementation idea.

I have worked in B2B SaaS sales for six years and know many people working in sales.

Immediate testers I can already identify include:

* **AV — salesperson at a technology company**  
* **myself — B2B SaaS Account Executive**  
* **other current/former sales colleagues I can contact privately**

I should now write down **at least 10 actual salespeople I can message**, rather than saying “I know many salespeople.”

Finding **200–300 potential users in relevant groups/communities** should also be substantially easier than finding 200–300 Heads of Implementation because B2B sales communities are much larger.

**Current confirmed count: 2 named users \+ myself.**

The next distribution task is to turn “many other salespeople” into an actual list of 10 people and identify at least one community containing 200–300 relevant salespeople.

---

# **The sprint version**

I am deliberately **not** building:

* CRM integration;  
* automatic CRM updates;  
* post-call summaries;  
* email follow-ups;  
* sales analytics;  
* manager dashboards;  
* deal scoring;  
* automated customer responses;  
* a complete sales platform.

For the Build Sprint, the product does **one thing**:

> **Listen to a live sales conversation and show the salesperson 3 useful things to say next, fast enough to use them.**

The proof is simple:

**A salesperson has a conversation they haven't scripted → customer raises a fresh question/objection → the product produces useful bullets before the salesperson needs to answer.**

If that doesn't work reliably and quickly, nothing else matters.


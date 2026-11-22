/** @format */

import bcrypt from "bcryptjs";

const globalForStore = globalThis;

export function toDateKey(input) {
  if (!input) return "";
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildNightIsoDates(offsetStartDays, nights) {
  const dates = [];
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  base.setUTCDate(base.getUTCDate() + offsetStartDays);
  for (let i = 0; i < nights; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    dates.push(d.toISOString());
  }
  const checkOut = new Date(base);
  checkOut.setUTCDate(base.getUTCDate() + nights);
  return {
    checkInDate: dates[0],
    checkOutDate: checkOut.toISOString(),
    bookedDates: dates,
    nights,
  };
}

const SUPPORT_GALLERY_POOL = [
  "/images/support-master-bedroom.jpg",
  "/images/support-chef-kitchen.jpg",
  "/images/support-spa-bathroom.jpg",
  "/images/support-rooftop-pool.jpg",
  "/images/support-work-studio.jpg",
  "/images/support-dining-patio.jpg",
];

function createSeedStore() {
  const stay1 = buildNightIsoDates(2, 3);
  const stay2 = buildNightIsoDates(7, 4);
  const stay3 = buildNightIsoDates(14, 2);
  const stay4 = buildNightIsoDates(20, 2);

  const apartments = [
    {
      _id: "apt-1",
      apartmentName: "Westlands Skyline Residences",
      location: "Nairobi, Westlands",
      keyboxCode: "8412#",
      keyboxInstructions:
        "Concierge desk issues foyer fob; smart lockbox is mounted right beside Penthouse Door 12A. Enter 8412# to drop the handle.",
      wifiName: "Westlands-Sky-5G",
      wifiPassword: "SkylineFiber#26",
      hostName: "Stephen Saidimu",
      hostEmail: "stevensaidimu@gmail.com",
      hostAvatar: "/images/avatars/host-stephen.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-2",
      apartmentName: "Diani Coral Arch Villas",
      location: "Kwale, Diani Beach",
      keyboxCode: "3095#",
      keyboxInstructions:
        "At the coral courtyard archway next to the palm gate, slide the brass cover and dial 3095# for your beach suite keys.",
      wifiName: "DianiCoral-WiFi",
      wifiPassword: "OceanBreeze2026",
      hostName: "Stephen Saidimu",
      hostEmail: "stevensaidimu@gmail.com",
      hostAvatar: "/images/avatars/host-stephen.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-3",
      apartmentName: "Kilimani Canopy Atelier",
      location: "Nairobi, Kilimani",
      keyboxCode: "5510#",
      keyboxInstructions:
        "Use lift to 6th floor. The slate lockbox sits inside the recessed oak mailbox cabinet — enter 5510# to collect the keycard.",
      wifiName: "Atelier-Fiber-Pro",
      wifiPassword: "KilimaniLoft88",
      hostName: "Grace Wanjiku",
      hostEmail: "grace@sherryhomes.com",
      hostAvatar: "/images/avatars/manager-grace.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-4",
      apartmentName: "Lavington Bougainvillea Veranda",
      location: "Nairobi, Lavington",
      keyboxCode: "6274#",
      keyboxInstructions:
        "Side garden entrance through the cedar trellis gate. Lockbox is behind the terracotta planter; enter 6274#.",
      wifiName: "Lavington-Garden-5G",
      wifiPassword: "TimberDeck2026!",
      hostName: "Stephen Saidimu",
      hostEmail: "stevensaidimu@gmail.com",
      hostAvatar: "/images/avatars/host-stephen.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-5",
      apartmentName: "Naivasha Lakeside Cedar Lofts",
      location: "Nakuru, Lake Naivasha",
      keyboxCode: "1948#",
      keyboxInstructions:
        "Lakeside timber reception cabin; turn left along the boardwalk to Loft 3. Enter 1948# on the keypad lock.",
      wifiName: "Naivasha-Shore-WiFi",
      wifiPassword: "SunriseHearth44",
      hostName: "Stephen Saidimu",
      hostEmail: "stevensaidimu@gmail.com",
      hostAvatar: "/images/avatars/host-stephen.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-6",
      apartmentName: "Nanyuki Highland Chalets",
      location: "Laikipia, Nanyuki",
      keyboxCode: "7731#",
      keyboxInstructions:
        "Stone gatehouse security logs your vehicle; smart keybox on Chalet B veranda pillar uses code 7731#.",
      wifiName: "Highland-Peak-5G",
      wifiPassword: "MtKenyaMorning!",
      hostName: "Grace Wanjiku",
      hostEmail: "grace@sherryhomes.com",
      hostAvatar: "/images/avatars/manager-grace.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-7",
      apartmentName: "Kilifi Creek Plunge Suites",
      location: "Kilifi, Bofa Creek",
      keyboxCode: "2406#",
      keyboxInstructions:
        "Walk past the mangrove viewing deck to Villa 4. The weatherproof keybox on the teak post opens with 2406#.",
      wifiName: "KilifiCreek-Fast",
      wifiPassword: "LagoonPlunge99",
      hostName: "Stephen Saidimu",
      hostEmail: "stevensaidimu@gmail.com",
      hostAvatar: "/images/avatars/host-stephen.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-8",
      apartmentName: "Runda Forest Canopy House",
      location: "Nairobi, Runda",
      keyboxCode: "9182#",
      keyboxInstructions:
        "Ring the intercom at the forest gate (Unit 1). Keybox inside the covered carport pillar opens with 9182#.",
      wifiName: "RundaCanopy-Fiber",
      wifiPassword: "CedarMist2026",
      hostName: "Stephen Saidimu",
      hostEmail: "stevensaidimu@gmail.com",
      hostAvatar: "/images/avatars/host-stephen.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-9",
      apartmentName: "Gigiri Diplomatic Residences",
      location: "Nairobi, Gigiri",
      keyboxCode: "4367#",
      keyboxInstructions:
        "Present booking ID at concierge lobby; smart keypad on Suite 8C activates immediately with 4367#.",
      wifiName: "Gigiri-Exec-5G",
      wifiPassword: "DiplomatStay#1",
      hostName: "Grace Wanjiku",
      hostEmail: "grace@sherryhomes.com",
      hostAvatar: "/images/avatars/manager-grace.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-10",
      apartmentName: "Malindi Swahili Riad Suites",
      location: "Kilifi, Malindi Old Town",
      keyboxCode: "6820#",
      keyboxInstructions:
        "Carved Lamu double door courtyard entry. Brass lockbox by the lantern sconce opens with 6820#.",
      wifiName: "MalindiRiad-WiFi",
      wifiPassword: "CoralArchStay77",
      hostName: "Stephen Saidimu",
      hostEmail: "stevensaidimu@gmail.com",
      hostAvatar: "/images/avatars/host-stephen.jpg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "apt-11",
      apartmentName: "Kileleshwa Courtyard Residences",
      location: "Nairobi, Kileleshwa",
      keyboxCode: "5104#",
      keyboxInstructions:
        "Enter Block A courtyard, take stairs to 2nd floor. Lockbox on the oak frame unlocks with 5104#.",
      wifiName: "Kileleshwa-Courtyard",
      wifiPassword: "OakLoftFiber26",
      hostName: "Stephen Saidimu",
      hostEmail: "stevensaidimu@gmail.com",
      hostAvatar: "/images/avatars/host-stephen.jpg",
      createdAt: new Date().toISOString(),
    },
  ];

  const rooms = [
    {
      _id: "room-1",
      roomName: "Skyline Glass Penthouse",
      roomType: "penthouse",
      numberOfGuests: "4",
      numberOfBeds: "2",
      roomDescription:
        "Corner golden-hour glass penthouse featuring a cream bouclé lounge, walnut dining table, chef kitchen, and panoramic Nairobi skyline balcony.",
      price: "195",
      nameOfApartment: "Westlands Skyline Residences",
    },
    {
      _id: "room-2",
      roomName: "Coral Arch Ocean Villa",
      roomType: "suite",
      numberOfGuests: "4",
      numberOfBeds: "2",
      roomDescription:
        "Whitewashed Swahili coral stone arch terrace opening straight onto turquoise Diani ocean breezes, woven rattan daybeds, and private spa bath.",
      price: "235",
      nameOfApartment: "Diani Coral Arch Villas",
    },
    {
      _id: "room-3",
      roomName: "Vaulted Concrete Atelier",
      roomType: "loft",
      numberOfGuests: "3",
      numberOfBeds: "2",
      roomDescription:
        "Boutique designer loft with recessed cove ceiling lighting, sage velvet seating, palm balcony, and dedicated ergonomic remote-work nook.",
      price: "140",
      nameOfApartment: "Kilimani Canopy Atelier",
    },
    {
      _id: "room-4",
      roomName: "Bougainvillea Timber Veranda",
      roomType: "deluxe",
      numberOfGuests: "4",
      numberOfBeds: "2",
      roomDescription:
        "Garden sanctuary with wide steel sliding glass opening onto a private timber deck, travertine hearth fireplace, and outdoor breakfast patio.",
      price: "160",
      nameOfApartment: "Lavington Bougainvillea Veranda",
    },
    {
      _id: "room-5",
      roomName: "Lakefront Hearth Cedar Loft",
      roomType: "loft",
      numberOfGuests: "4",
      numberOfBeds: "2",
      roomDescription:
        "Handcrafted stone-and-cedar lakeside retreat overlooking Lake Naivasha with crackling fireplace, acacia furnishings, and sunrise deck.",
      price: "175",
      nameOfApartment: "Naivasha Lakeside Cedar Lofts",
    },
    {
      _id: "room-6",
      roomName: "Mount Kenya Peak Chalet",
      roomType: "suite",
      numberOfGuests: "4",
      numberOfBeds: "2",
      roomDescription:
        "Elevated highland timber chalet terrace framing snow-dusted Mount Kenya peaks, deep navy lounge seating, and artisan breakfast bar.",
      price: "185",
      nameOfApartment: "Nanyuki Highland Chalets",
    },
    {
      _id: "room-7",
      roomName: "Mangrove Plunge Deck Suite",
      roomType: "penthouse",
      numberOfGuests: "4",
      numberOfBeds: "2",
      roomDescription:
        "Private teak plunge-pool cliff terrace hovering over Kilifi Creek lagoon with shaded loungers, coastal kitchen, and breezy master suite.",
      price: "245",
      nameOfApartment: "Kilifi Creek Plunge Suites",
    },
    {
      _id: "room-8",
      roomName: "Canopy Glass Treehouse",
      roomType: "loft",
      numberOfGuests: "2",
      numberOfBeds: "1",
      roomDescription:
        "Misty woodland glass pavilion tucked inside Runda canopy trees with Belgian linen sofa, cast-iron wood stove, and tranquil work desk.",
      price: "165",
      nameOfApartment: "Runda Forest Canopy House",
    },
    {
      _id: "room-9",
      roomName: "Executive Oak Residence",
      roomType: "suite",
      numberOfGuests: "2",
      numberOfBeds: "1",
      roomDescription:
        "Tailored diplomatic suite in Gigiri featuring bespoke oak wall paneling, Carrara marble dining island, high-speed fiber, and garden terrace.",
      price: "155",
      nameOfApartment: "Gigiri Diplomatic Residences",
    },
    {
      _id: "room-10",
      roomName: "Swahili Plunge Riad Suite",
      roomType: "deluxe",
      numberOfGuests: "3",
      numberOfBeds: "2",
      roomDescription:
        "Hand-carved Lamu daybed lounge under brass pendant lanterns opening onto a turquoise courtyard plunge pool in historic Malindi.",
      price: "150",
      nameOfApartment: "Malindi Swahili Riad Suites",
    },
    {
      _id: "room-11",
      roomName: "Courtyard Oak Loft",
      roomType: "loft",
      numberOfGuests: "4",
      numberOfBeds: "2",
      roomDescription:
        "Sunlit courtyard dining loft with steel-framed terrace doors, high-speed fiber Wi-Fi, and full chef kitchen in Kileleshwa.",
      price: "145",
      nameOfApartment: "Kileleshwa Courtyard Residences",
    },
    {
      _id: "room-12",
      roomName: "Atrium Corner Studio",
      roomType: "single",
      numberOfGuests: "2",
      numberOfBeds: "1",
      roomDescription:
        "Quiet corner studio overlooking the olive courtyard with dedicated workspace, percale linen bedding, and espresso bar.",
      price: "115",
      nameOfApartment: "Kileleshwa Courtyard Residences",
    },
  ];

  const mainImageMap = {
    "Skyline Glass Penthouse": "/images/apt-westlands-skyline.jpg",
    "Coral Arch Ocean Villa": "/images/apt-diani-oceanfront.jpg",
    "Vaulted Concrete Atelier": "/images/apt-kilimani-atelier.jpg",
    "Bougainvillea Timber Veranda": "/images/apt-lavington-veranda.jpg",
    "Lakefront Hearth Cedar Loft": "/images/apt-naivasha-lakeside.jpg",
    "Mount Kenya Peak Chalet": "/images/apt-nanyuki-highland.jpg",
    "Mangrove Plunge Deck Suite": "/images/apt-kilifi-creek.jpg",
    "Canopy Glass Treehouse": "/images/apt-runda-forest.jpg",
    "Executive Oak Residence": "/images/apt-gigiri-diplomatic.jpg",
    "Swahili Plunge Riad Suite": "/images/apt-malindi-coral.jpg",
    "Courtyard Oak Loft": "/images/suite-courtyard.jpg",
    "Atrium Corner Studio": "/images/suite-showcase.jpg",
  };

  const mainImages = rooms.map((r, idx) => ({
    _id: `img-main-${idx + 1}`,
    selectedRoomName: r.roomName,
    mainImage: mainImageMap[r.roomName] || "/images/suite-showcase.jpg",
  }));

  // 1 main + 6 distinct supporting interior/amenity images (at least 5 supporting images per room!)
  const minorImages = rooms.map((r, idx) => {
    const main = mainImageMap[r.roomName] || "/images/suite-showcase.jpg";
    const rotated = SUPPORT_GALLERY_POOL.map(
      (_, i) => SUPPORT_GALLERY_POOL[(i + idx) % SUPPORT_GALLERY_POOL.length]
    );
    return {
      _id: `img-minor-${idx + 1}`,
      selectedRoomName: r.roomName,
      minorImages: [main, ...rotated],
    };
  });

  return {
    users: [
      {
        _id: "usr-super-1",
        firstName: "Stephen",
        lastName: "Saidimu",
        username: "Compess",
        email: "stevensaidimu@gmail.com",
        phoneNumber: "+254 700 100 200",
        gender: "male",
        role: "super_admin",
        avatar: "/images/avatars/host-stephen.jpg",
        createdBy: "system",
        password: bcrypt.hashSync("Compess.1234#", 10),
        date: new Date().toISOString(),
      },
      {
        _id: "usr-manager-1",
        firstName: "Grace",
        lastName: "Wanjiku",
        username: "grace_mgr",
        email: "grace@sherryhomes.com",
        phoneNumber: "+254 711 222 333",
        gender: "female",
        role: "manager",
        avatar: "/images/avatars/manager-grace.jpg",
        createdBy: "stevensaidimu@gmail.com",
        password: bcrypt.hashSync("manager1234", 10),
        date: new Date().toISOString(),
      },
      {
        _id: "usr-guest-1",
        firstName: "Amina",
        lastName: "Ochieng",
        username: "amina_guest",
        email: "amina@example.com",
        phoneNumber: "+254 712 345 678",
        gender: "female",
        role: "guest",
        avatar: "/images/avatars/guest-amina.jpg",
        createdBy: "",
        password: bcrypt.hashSync("guest1234", 10),
        date: new Date().toISOString(),
      },
      {
        _id: "usr-guest-2",
        firstName: "Daniel",
        lastName: "Mwangi",
        username: "daniel_guest",
        email: "daniel@example.com",
        phoneNumber: "+254 722 888 999",
        gender: "male",
        role: "guest",
        avatar: "/images/avatars/guest-daniel.jpg",
        createdBy: "",
        password: bcrypt.hashSync("guest1234", 10),
        date: new Date().toISOString(),
      },
    ],
    apartments,
    rooms,
    mainImages,
    minorImages,
    bookings: [
      {
        _id: "bk-1",
        roomName: "Skyline Glass Penthouse",
        apartmentName: "Westlands Skyline Residences",
        guestName: "Amina Ochieng",
        guestEmail: "amina@example.com",
        guestAvatar: "/images/avatars/guest-amina.jpg",
        checkInDate: stay1.checkInDate,
        checkOutDate: stay1.checkOutDate,
        bookedDates: stay1.bookedDates,
        nights: stay1.nights,
        totalPrice: 630,
        paymentStatus: "paid",
        hostApproved: true,
        approvedBy: "Stephen Saidimu",
        approvedAt: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: "card",
        isBlocked: false,
        notes: "Early afternoon arrival requested.",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        _id: "bk-2",
        roomName: "Coral Arch Ocean Villa",
        apartmentName: "Diani Coral Arch Villas",
        guestName: "Daniel Mwangi",
        guestEmail: "daniel@example.com",
        guestAvatar: "/images/avatars/guest-daniel.jpg",
        checkInDate: stay2.checkInDate,
        checkOutDate: stay2.checkOutDate,
        bookedDates: stay2.bookedDates,
        nights: stay2.nights,
        totalPrice: 985,
        paymentStatus: "paid",
        hostApproved: false,
        approvedBy: "",
        paymentMethod: "mpesa",
        isBlocked: false,
        notes: "M-Pesa payment submitted; awaiting host verification.",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        _id: "bk-3",
        roomName: "Vaulted Concrete Atelier",
        apartmentName: "Kilimani Canopy Atelier",
        guestName: "Amina Ochieng",
        guestEmail: "amina@example.com",
        guestAvatar: "/images/avatars/guest-amina.jpg",
        checkInDate: stay3.checkInDate,
        checkOutDate: stay3.checkOutDate,
        bookedDates: stay3.bookedDates,
        nights: stay3.nights,
        totalPrice: 325,
        paymentStatus: "pending",
        hostApproved: false,
        approvedBy: "",
        paymentMethod: "property",
        isBlocked: false,
        notes: "Pay-on-arrival selected.",
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        _id: "bk-4",
        roomName: "Bougainvillea Timber Veranda",
        apartmentName: "Lavington Bougainvillea Veranda",
        guestName: "Host Maintenance Block",
        guestEmail: "stevensaidimu@gmail.com",
        guestAvatar: "/images/avatars/host-stephen.jpg",
        checkInDate: stay4.checkInDate,
        checkOutDate: stay4.checkOutDate,
        bookedDates: stay4.bookedDates,
        nights: stay4.nights,
        totalPrice: 0,
        paymentStatus: "blocked",
        hostApproved: false,
        paymentMethod: "host_block",
        isBlocked: true,
        notes: "Deep clean & timber deck oiling",
        createdAt: new Date().toISOString(),
      },
    ],
    payments: [
      {
        _id: "pay-1",
        bookingId: "bk-1",
        roomName: "Skyline Glass Penthouse",
        apartmentName: "Westlands Skyline Residences",
        guestName: "Amina Ochieng",
        guestEmail: "amina@example.com",
        guestAvatar: "/images/avatars/guest-amina.jpg",
        nights: 3,
        subtotal: 585,
        cleaningFee: 25,
        serviceFee: 20,
        amount: 630,
        method: "card",
        last4: "4242",
        reference: "SH-PAY-9041",
        status: "paid",
        hostApproved: true,
        approvedBy: "Stephen Saidimu",
        approvedAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        _id: "pay-2",
        bookingId: "bk-2",
        roomName: "Coral Arch Ocean Villa",
        apartmentName: "Diani Coral Arch Villas",
        guestName: "Daniel Mwangi",
        guestEmail: "daniel@example.com",
        guestAvatar: "/images/avatars/guest-daniel.jpg",
        nights: 4,
        subtotal: 940,
        cleaningFee: 25,
        serviceFee: 20,
        amount: 985,
        method: "mpesa",
        last4: "8999",
        reference: "SH-MPESA-9042",
        status: "paid",
        hostApproved: false,
        approvedBy: "",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        _id: "pay-3",
        bookingId: "bk-3",
        roomName: "Vaulted Concrete Atelier",
        apartmentName: "Kilimani Canopy Atelier",
        guestName: "Amina Ochieng",
        guestEmail: "amina@example.com",
        guestAvatar: "/images/avatars/guest-amina.jpg",
        nights: 2,
        subtotal: 280,
        cleaningFee: 25,
        serviceFee: 20,
        amount: 325,
        method: "property",
        last4: "",
        reference: "SH-PROP-9043",
        status: "pending",
        hostApproved: false,
        approvedBy: "",
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ],
    messages: [
      {
        _id: "thr-1",
        apartmentName: "Westlands Skyline Residences",
        roomName: "Skyline Glass Penthouse",
        guestName: "Amina Ochieng",
        guestEmail: "amina@example.com",
        guestAvatar: "/images/avatars/guest-amina.jpg",
        hostName: "Stephen Saidimu",
        hostAvatar: "/images/avatars/host-stephen.jpg",
        subject: "Check-in keybox & fiber Wi-Fi confirmed",
        unreadForHost: true,
        unreadForGuest: false,
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        messages: [
          {
            _id: "msg-1",
            senderRole: "guest",
            senderName: "Amina Ochieng",
            text: "Hello Stephen, my flight lands at 11:30 AM. Would early bag drop at Skyline Glass Penthouse be possible?",
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          },
          {
            _id: "msg-2",
            senderRole: "host",
            senderName: "Stephen Saidimu",
            text: "Hi Amina! Your payment is verified and I have unlocked your keybox code and fiber Wi-Fi credentials inside My Bookings.",
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            _id: "msg-3",
            senderRole: "guest",
            senderName: "Amina Ochieng",
            text: "Got them right under My Bookings — thank you so much!",
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
        ],
      },
      {
        _id: "thr-2",
        apartmentName: "Diani Coral Arch Villas",
        roomName: "Coral Arch Ocean Villa",
        guestName: "Daniel Mwangi",
        guestEmail: "daniel@example.com",
        guestAvatar: "/images/avatars/guest-daniel.jpg",
        hostName: "Stephen Saidimu",
        hostAvatar: "/images/avatars/host-stephen.jpg",
        subject: "M-Pesa payment verification & gate instructions",
        unreadForHost: true,
        unreadForGuest: false,
        updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        messages: [
          {
            _id: "msg-4",
            senderRole: "guest",
            senderName: "Daniel Mwangi",
            text: "Hi Stephen, I just paid via M-Pesa (ref SH-MPESA-9042). Please approve once confirmed so I can view the villa keybox details.",
            createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
          },
        ],
      },
    ],
    reviews: [
      {
        _id: "rev-1",
        apartmentName: "Westlands Skyline Residences",
        roomName: "Skyline Glass Penthouse",
        guestName: "Amina Ochieng",
        guestAvatar: "/images/avatars/guest-amina.jpg",
        rating: 5,
        comment:
          "Golden-hour views over Westlands were surreal, and Stephen verified payment immediately so keybox entry took 60 seconds.",
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        _id: "rev-2",
        apartmentName: "Diani Coral Arch Villas",
        roomName: "Coral Arch Ocean Villa",
        guestName: "Daniel Mwangi",
        guestAvatar: "/images/avatars/guest-daniel.jpg",
        rating: 5,
        comment:
          "Waking up to the turquoise ocean arches and sea breeze felt like a private coastal resort.",
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        _id: "rev-3",
        apartmentName: "Kilimani Canopy Atelier",
        roomName: "Vaulted Concrete Atelier",
        guestName: "Sarah Njeri",
        guestAvatar: "/images/avatars/guest-amina.jpg",
        rating: 5,
        comment:
          "Architectural concrete ceiling and sunlit balcony workspace made my 5-day workation effortless.",
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        _id: "rev-4",
        apartmentName: "Naivasha Lakeside Cedar Lofts",
        roomName: "Lakefront Hearth Cedar Loft",
        guestName: "David Mutua",
        guestAvatar: "/images/avatars/guest-daniel.jpg",
        rating: 5,
        comment:
          "Lighting the fireplace while watching sunrise shimmer on Lake Naivasha was unforgettable.",
        createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      },
    ],
  };
}

export function getStore() {
  if (!globalForStore.__sherryStore) {
    globalForStore.__sherryStore = createSeedStore();
  }
  return globalForStore.__sherryStore;
}

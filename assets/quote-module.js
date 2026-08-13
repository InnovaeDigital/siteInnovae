import { doc, deleteDoc, getDoc, getDocs, query, setDoc, where, collection } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";
import { db, storage } from "../firebase-client.js";

const quotesCollection = "quotes";
const quoteMediaRoot = "quote-references";

export async function uploadReferencePhotos(files) {
  const selected = [...files].filter((file) => file.type.startsWith("image/")).slice(0, 3);
  const photos = [];
  for (const file of selected) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
    const fileRef = ref(storage, `${quoteMediaRoot}/${crypto.randomUUID()}-${safeName}`);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    photos.push({ name: file.name, url, path: snapshot.ref.fullPath });
  }
  return photos;
}

export async function saveQuote(data) {
  await setDoc(doc(db, quotesCollection, data.id), data, { merge: true });
  return data.id;
}

export async function listQuotes(ownerId) {
  const snapshot = await getDocs(query(collection(db, quotesCollection), where("ownerId", "==", ownerId)));
  return snapshot.docs
    .map((item) => item.data())
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

export async function loadQuote(id) {
  const snapshot = await getDoc(doc(db, quotesCollection, id));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function deleteQuote(id) {
  await deleteDoc(doc(db, quotesCollection, id));
}

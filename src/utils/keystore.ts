/*
 * This file is part of the Babble project.
 * Babble is a platform agnostic browser extension that allows for easy
 * encryption and decryption of text data across the web.
 * Copyright (C) 2019  keur, yvbbrjdr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict';

import * as cryptoutils from './cryptoutils';

export interface KeystoreEntry {
  name: string;
  passphrase: string;
  key: Array<number>;
  base: string;
  tags: string[];
}

export interface DebabbleResult {
  clearText: string;
  keyName: string;
  keyId: number;
}

export const getKeystore = (): Promise<KeystoreEntry[]> => {
  return new Promise<KeystoreEntry[]>(
    ( resolve: ( _: KeystoreEntry[] ) => void ) => {
      chrome.storage.local.get( { keystore: [] }, result => {
        resolve( result.keystore );
      } );
    }
  );
};

const setKeystore = ( keystore: KeystoreEntry[] ): Promise<void> => {
  return new Promise<void>( ( resolve: () => void ) => {
    chrome.storage.local.set( { keystore: keystore }, resolve );
  } );
};

export const clearKeystore = (): Promise<void> => {
  return new Promise<void>( ( resolve: () => void ) => {
    chrome.storage.local.set( { keystore: [] }, resolve );
  } );
};

export const getKeystoreSize = async (): Promise<number> => {
  const keystore = await getKeystore();
  return keystore.length;
};

export const getEntry = async ( id: number ): Promise<KeystoreEntry> => {
  const keystore = await getKeystore();
  return keystore[id];
};

export const addEntry = async (
  name: string,
  passphrase: string,
  base: string,
  tags: string[]
): Promise<void> => {
  let keystore = await getKeystore();
  keystore.push( {
    name: name,
    passphrase: passphrase,
    key: Array.from( await cryptoutils.deriveKey( passphrase ) ),
    base: base,
    tags: tags
  } );
  return setKeystore( keystore );
};

export const editEntry = async (
  id: number,
  name: string,
  passphrase: string,
  base: string,
  tags: string[]
): Promise<void> => {
  let keystore = await getKeystore();
  keystore[id] = {
    name: name,
    passphrase: passphrase,
    key: Array.from( await cryptoutils.deriveKey( passphrase ) ),
    base: base,
    tags: tags
  };
  return setKeystore( keystore );
};

export const delEntry = async ( id: number ): Promise<void> => {
  let keystore = await getKeystore();
  keystore.splice( id, 1 );
  return setKeystore( keystore );
};

export const babbleWithSelectedEntry = async ( s: string ): Promise<string> => {
  const keystore = await getKeystore();
  const id = await getSelectedEntry();
  return cryptoutils.babble(
    s,
    Uint8Array.from( keystore[id].key ),
    keystore[id].base
  );
};

export const debabbleWithAllEntries = async (
  s: string
): Promise<DebabbleResult> => {
  const keystore = await getKeystore();
  for ( const [ keyId, entry ] of keystore.entries() ) {
    const debabble = await cryptoutils.debabble(
      s,
      Uint8Array.from( entry.key ),
      entry.base
    );
    if ( debabble !== '' ) {
      return {
        clearText: debabble,
        keyName: entry.name,
        keyId: keyId
      };
    }
  }
  return {
    clearText: '',
    keyName: '',
    keyId: 0
  };
};

export const getSelectedEntry = (): Promise<number> => {
  return new Promise<number>( ( resolve: ( _: number ) => void ) => {
    chrome.storage.local.get( { keystoreSelectedEntry: 0 }, async result => {
      const size: number = await getKeystoreSize();
      if ( result.keystoreSelectedEntry >= size ) {
        await setSelectedEntry( 0 );
        resolve( 0 );
      } else {
        resolve( result.keystoreSelectedEntry );
      }
    } );
  } );
};

export const setSelectedEntry = ( id: number ): Promise<void> => {
  return new Promise<void>( ( resolve: () => void ) => {
    chrome.storage.local.set( { keystoreSelectedEntry: id }, resolve );
  } );
};

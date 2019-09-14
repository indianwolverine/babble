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

// TODO: Maybe change request and requestClass to enum
export interface Request {
  request: string;
  data?: string;
  requestClass?: string;
}

export interface Response {
  success: boolean;
  data: any; // TODO: be more strict here?
}

export const sendMessage = (message: Request): Promise<any> => {
  return new Promise<any>((resolve: (data: any) => void) => {
    chrome.runtime.sendMessage(message, (response: Response): void => {
      resolve(response);
    });
  });
};

export const sendMessageActiveTab = (
  message: any,
  responseCallback?: (response: any) => void
): void => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const activeTab: chrome.tabs.Tab | null = tabs.length > 0 ? tabs[0] : null;
    if (activeTab && activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, message, responseCallback);
    }
  });
};

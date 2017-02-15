/* global describe, it */
global.__API_HOST__ = 'example.com';
global.__API_ENDPOINT__ = '/api';

import { createAction } from 'redux-actions';
import expect from 'expect';
import {
  reducer,
  setHeaders,
  setHeader,
  setEndpointHost,
  setEndpointPath,
  IS_DELETING,
  IS_UPDATING
} from '../src/jsonapi';

import fetchMock from 'fetch-mock';
import { apiRequest } from '../src/utils';

const apiCreated = createAction('API_CREATED');
const apiRead = createAction('API_READ');
const apiUpdated = createAction('API_UPDATED');
const apiDeleted = createAction('API_DELETED');

const apiWillUpdate = createAction('API_WILL_UPDATE');
const apiWillDelete = createAction('API_WILL_DELETE');

const state = {
  endpoint: {
    host: null,
    path: null,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json'
    }
  },
  users: {
    data: [
      {
        type: 'users',
        id: '1',
        attributes: {
          name: 'John Doe'
        },
        relationships: {
          companies: {
            data: null
          }
        }
      },
      {
        type: 'users',
        id: '2',
        attributes: {
          name: 'Emily Jane'
        },
        relationships: {
          companies: {
            data: null
          }
        }
      }
    ]
  },
  transactions: {
    data: [
      {
        type: 'transactions',
        id: '34',
        attributes: {
          description: 'ABC',
          createdAt: '2016-02-12T13:34:01+0000',
          updatedAt: '2016-02-19T11:52:43+0000',
        },
        relationships: {
          task: {
            data: null
          }
        },
        links: {
          self: 'http://localhost/transactions/34'
        }
      }
    ]
  },
  isCreating: 0,
  isReading: 0,
  isUpdating: 0,
  isDeleting: 0
};

const stateWithoutUsersResource = {
  endpoint: {
    host: null,
    path: null,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json'
    }
  },
  transactions: {
    data: [
      {
        type: 'transactions',
        id: '34',
        attributes: {
          description: 'ABC',
          createdAt: '2016-02-12T13:34:01+0000',
          updatedAt: '2016-02-19T11:52:43+0000',
        },
        relationships: {
          task: {
            data: null
          }
        },
        links: {
          self: 'http://localhost/transactions/34'
        }
      }
    ]
  },
  isCreating: 0,
  isReading: 0,
  isUpdating: 0,
  isDeleting: 0
};

const taskWithoutRelationship = {
  type: 'tasks',
  id: '43',
  attributes: {
    name: 'ABC',
    createdAt: '2016-02-19T11:52:43+0000',
    updatedAt: '2016-02-19T11:52:43+0000'
  }
};

const taskWithTransaction = {
  type: 'tasks',
  id: '43',
  attributes: {
    name: 'ABC',
    createdAt: '2016-02-19T11:52:43+0000',
    updatedAt: '2016-02-19T11:52:43+0000'
  },
  relationships: {
    taskList: {
      data: {
        type: 'taskLists',
        id: '1'
      }
    },
    transaction: {
      data: {
        type: 'transactions',
        id: '34'
      }
    }
  },
  links: {
    self: 'http://localhost/tasks/43'
  }
};

const taskWithTransactions = {
  type: 'tasks',
  id: '43',
  attributes: {
    name: 'ABC',
    createdAt: '2016-02-19T11:52:43+0000',
    updatedAt: '2016-02-19T11:52:43+0000'
  },
  relationships: {
    taskList: {
      data: {
        type: 'taskLists',
        id: '1'
      }
    },
    transaction: {
      data: [
        {
          type: 'transactions',
          id: '34'
        }
      ]
    }
  },
  links: {
    self: 'http://localhost/tasks/43'
  }
};

const transactionToDelete = {
  type: 'transactions',
  id: '34',
  attributes: {
    description: 'ABC',
    createdAt: '2016-02-12T13:34:01+0000',
    updatedAt: '2016-02-19T11:52:43+0000',
  },
  relationships: {
    task: {
      data: null
    }
  },
  links: {
    self: 'http://localhost/transactions/34'
  }
};

const transactionWithTask = {
  ... transactionToDelete,
  relationships: {
    task: {
      data: {
        type: 'tasks',
        id: '43'
      }
    }
  }
};

const updatedUser = {
  type: 'users',
  id: '1',
  attributes: {
    name: 'Sir John Doe'
  },
  relationships: {
    tasks: {
      data: null
    }
  }
};

const multipleResources = [
  {
    ... taskWithTransaction
  }
];

const readResponse = {
  data: [
    taskWithTransaction
  ]
};

const readResponseWithIncluded = {
  ... readResponse,
  included: [
    {
      type: 'transactions',
      id: '35',
      attributes: {
        description: 'DEF',
        createdAt: '2016-02-12T13:35:01+0000',
        updatedAt: '2016-02-19T11:52:43+0000',
      },
      relationships: {
        task: {
          data: null
        }
      },
      links: {
        self: 'http://localhost/transactions/35'
      }
    }
  ]
};

const responseDataWithSingleResource = {
  data: {
    type: 'companies',
    id: '1',
    attributes: {
      name: 'Dixie.io',
      slug: 'dixie.io',
      createdAt: '2016-04-08T08:42:45+0000',
      updatedAt: '2016-04-08T08:42:45+0000',
      role: 'bookkeeper'
    },
    relationships: {
      users: {
        data: [{
          type: 'users',
          id: '1'
        }]
      },
      employees: {
        data: [{
          type: 'users',
          id: '1'
        }]
      },
      bookkeepers: {
        data: [{
          type: 'users',
          id: '4'
        }]
      },
      bookkeeper_state: {
        data: {
          type: 'bookkeeper_state',
          id: '2'
        }
      }
    },
    links: {
      self: 'http:\/\/gronk.app\/api\/v1\/companies\/1'
    }
  },
  included: [{
    type: 'users',
    id: '1',
    attributes: {
      name: 'Ron Star',
      email: 'stefan+stefan+ronni-dixie.io-dixie.io@dixie.io',
      createdAt: '2016-04-08T08:42:45+0000',
      updatedAt: '2016-04-13T08:28:58+0000'
    },
    relationships: {
      companies: {
        data: [{
          type: 'companies',
          id: '1'
        }]
      }
    }
  }]
};

const responseDataWithOneToManyRelationship = {
  data: [
    {
      type: 'companies',
      id: '1',
      attributes: {
        name: 'Dixie.io',
        slug: 'dixie.io',
        createdAt: '2016-04-08T08:42:45+0000',
        updatedAt: '2016-04-08T08:42:45+0000'
      },
      relationships: {
        user: {
          data: {
            type: 'users',
            id: '1'
          }
        }
      },
      links: {
        self: 'http:\/\/gronk.app\/api\/v1\/companies\/1'
      }
    },
    {
      type: 'companies',
      id: '2',
      attributes: {
        name: 'Dixie.io',
        slug: 'dixie.io',
        createdAt: '2016-04-08T08:42:45+0000',
        updatedAt: '2016-04-08T08:42:45+0000'
      },
      relationships: {
        user: {
          data: {
            type: 'users',
            id: '1'
          }
        }
      },
      links: {
        self: 'http:\/\/gronk.app\/api\/v1\/companies\/2'
      }
    }
  ]
};

const payloadWithNonMatchingReverseRelationships = require('./payloads/withNonMatchingReverseRelationships.json');

describe('Creation of new resources', () => {
  it('should automatically organize new resource in new key on state', () => {
    const updatedState = reducer(state, apiCreated(taskWithoutRelationship));
    expect(updatedState.tasks).toBeAn('object');
  });

  it('should add reverse relationship when inserting new resource', () => {
    const updatedState = reducer(state, apiCreated(taskWithTransaction));

    const { data: taskRelationship } = updatedState.transactions.data[0].relationships.task;

    expect(taskRelationship.type).toEqual(taskWithTransaction.type);
    expect(taskRelationship.id).toEqual(taskWithTransaction.id);
    expect(updatedState.isCreating).toEqual(state.isCreating - 1);
  });

  it('should handle multiple resources', () => {
    const updatedState = reducer(state, apiCreated(multipleResources));
    expect(updatedState.tasks).toBeAn('object');
  });
});

describe('Reading resources', () => {
  it('should append read resources to state', () => {
    const updatedState = reducer(state, apiRead(readResponse));
    expect(updatedState.tasks).toBeAn('object');
    expect(updatedState.tasks.data.length).toEqual(1);
  });

  it('should append included resources in state', () => {
    const updatedState = reducer(state, apiRead(readResponseWithIncluded));
    expect(
      updatedState.transactions.data.length
    ).toEqual(
      state.transactions.data.length + 1
    );
  });

  it('should handle response where data is an object', () => {
    const updatedState = reducer(undefined, apiRead(responseDataWithSingleResource));
    expect(updatedState.users).toBeAn('object');
    expect(updatedState.companies).toBeAn('object');
  });

  it('should handle response with a one to many relationship', () => {
    const updatedState = reducer(state, apiRead(responseDataWithOneToManyRelationship));
    expect(updatedState.users).toBeAn('object');
    expect(updatedState.companies).toBeAn('object');
    expect(updatedState.users.data[0].relationships.companies.data).toBeAn('array');
  });

  it('should ignore reverse relationship with no matching resource', () => {
    const updatedState = reducer(state, apiRead(payloadWithNonMatchingReverseRelationships));

    payloadWithNonMatchingReverseRelationships.included
      .filter(resource => resource.type === 'reports')
      .forEach(
        payloadReport => {
          const stateReport = updatedState.reports.data.find(r => payloadReport.id === r.id);
          expect(stateReport.relationships.file.data.id).toEqual(payloadReport.relationships.file.data.id);
        }
      );
  });
});

const zip = rows => rows[0].map((_, c) => rows.map(row => row[c]));

describe('Updating resources', () => {
  it('should persist in state and preserve order', () => {
    const updatedState = reducer(state, apiUpdated(updatedUser));
    expect(state.users.data[0].attributes.name).toNotEqual(updatedUser.attributes.name);
    expect(updatedState.users.data[0].attributes.name).toEqual(updatedUser.attributes.name);
    zip([updatedState.users.data, state.users.data]).forEach((a, b) => expect(a.id).toEqual(b.id));
  });

  it('should be able to update a resource before type is in state', () => {
    const userToUpdate = state.users.data[0];
    const stateWithResourceType = reducer(stateWithoutUsersResource, apiWillUpdate(userToUpdate));
    const updatedState = reducer(stateWithResourceType, apiUpdated(updatedUser));
    expect(updatedState.users.data[0]).toEqual(updatedUser);
  });
});

describe('Delete resources', () => {
  it('should remove resource from state', () => {
    const updatedState = reducer(state, apiDeleted(transactionToDelete));
    expect(updatedState.transactions.data.length).toEqual(0);
  });

  it('should remove reverse relationship', () => {
    const stateWithTask = reducer(state, apiCreated(taskWithTransaction));
    expect(stateWithTask.transactions.data[0].relationships.task.data.type).toEqual(taskWithTransaction.type);
    const stateWithoutTask = reducer(stateWithTask, apiDeleted(taskWithTransaction));
    const { data: relationship } = stateWithoutTask.transactions.data[0].relationships.task;
    expect(relationship).toEqual(null);
  });

  describe('when one-to-many relationship', () => {
    it('should update reverse relationship for transaction', () => {
      // Add task with transactions to state
      const stateWithTask = reducer(state, apiCreated(taskWithTransactions));
      // Update relation between transaction and task
      const stateWithTaskWithTransaction = reducer(stateWithTask, apiUpdated(transactionWithTask));

      expect(stateWithTaskWithTransaction.transactions.data[0].relationships.task.data.type).toEqual(taskWithTransactions.type);

      const stateWithoutTask = reducer(stateWithTask, apiDeleted(taskWithTransaction));
      const { data: relationship } = stateWithoutTask.transactions.data[0].relationships.task;
      expect(relationship).toEqual(null);
    });

    it('should update reverse relationship for task', () => {
      // Add task with transactions to state
      const stateWithTask = reducer(state, apiCreated(taskWithTransactions));
      // Update relation between transaction and task
      // TODO: check relationshiphs on create resource
      const stateWithTaskWithTransaction = reducer(stateWithTask, apiUpdated(transactionWithTask));

      expect(stateWithTaskWithTransaction.transactions.data[0].id).toEqual(taskWithTransactions.relationships.transaction.data[0].id);

      const stateWithoutTransaction = reducer(stateWithTask, apiDeleted(transactionWithTask));
      const { data: relationship } = stateWithoutTransaction.tasks.data[0].relationships.transaction;
      expect(relationship).toEqual([]);
    });
  });
});

describe('Endpoint values', () => {
  it('should default to jsonapi content type and accept headers', () => {
    const initialState = reducer(undefined, { type: '@@INIT' });
    expect(initialState.endpoint.headers).toEqual({
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json'
    });
  });

  it('should update provided header, such as an access token', () => {
    const at = 'abcdef0123456789';
    const header = { Authorization: `Bearer ${at}` };
    expect(state.endpoint.headers).toNotEqual(header);
    const updatedState = reducer(state, setHeader(header));
    expect(updatedState.endpoint.headers).toEqual({
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${at}`
    });
  });

  it('should update to provided custom headers', () => {
    const headers = { Custom: 'headers' };
    expect(state.endpoint.headers).toNotEqual(headers);
    const updatedState = reducer(state, setHeaders(headers));
    expect(updatedState.endpoint.headers).toEqual(headers);
  });

  it('should update to provided endpoint host and path', () => {
    const host = 'https://api.example.com';
    const path = '/api/v1';

    expect(state.endpoint.host).toNotEqual(host);
    const stateWithHost = reducer(state, setEndpointHost(host));
    expect(stateWithHost.endpoint.host).toEqual(host);

    expect(state.endpoint.path).toNotEqual(path);
    const stateWithPath = reducer(state, setEndpointPath(path));
    expect(stateWithPath.endpoint.path).toEqual(path);
  });
});

describe('Invalidating flag', () => {
  it('should set before delete', () => {
    const updatedState = reducer(state, apiWillDelete(state.users.data[0]));
    expect(updatedState.users.data[0].isInvalidating).toEqual(IS_DELETING);
  });

  it('should set before update', () => {
    const updatedState = reducer(state, apiWillUpdate(state.users.data[0]));
    expect(updatedState.users.data[0].isInvalidating).toEqual(IS_UPDATING);
  });

  it('should be removed after update', () => {
    const updatedState = reducer(
      reducer(state, apiWillUpdate(state.users.data[0])),
      apiUpdated(state.users.data[0])
    );
    expect(updatedState.users.data[0].isInvalidating).toNotExist();
  });
});

describe('apiRequest', () => {
  it('should parse the response body on success', () => {
    fetchMock.mock('*', { status: 200, body: { data: 1 }, headers: { 'Content-Type': 'application/json' } });
    return apiRequest('fakeurl').then((data) => {
      expect(data).toEqual({ data: 1 });
    });
  });

  it('should return Body object when response is 204', () => {
    fetchMock.restore();
    fetchMock.mock('*', { status: 204, body: null });

    return apiRequest('fakeurl').then((data) => {
      expect(data.statusText).toEqual('No Content');
      expect(data.status).toEqual(204);
    });
  });
});

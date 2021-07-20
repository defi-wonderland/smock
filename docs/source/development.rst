Development
===============

Code
----

Open an issue or a PR, we will try to see it asap.

Docs
----

In order to continue developing the docs, you will first need to install the needed dependencies locally by running:

.. tabs::

  .. group-tab:: yarn

    .. code-block:: text

      yarn docs:install

  .. group-tab:: npm

    .. code-block:: text

      npm run docs:install


Then you can run the sphinx autobuild to see your changes live:
  
.. tabs::

  .. group-tab:: yarn

    .. code-block:: text

      yarn docs:watch

  .. group-tab:: npm

    .. code-block:: text

      npm run docs:watch
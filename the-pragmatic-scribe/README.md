The Pragmatic Scribe
====================================

> *Say what you mean, simply and directly.*
>
> *- Brian W. Kernighan, The Elements of Programming Style*

Table of Contents
---------------------------

- [Introduction](#introduction)
- [A Note on Systems](#a-note-on-systems)
- [Philosophy](#philosophy)
- [Formats](#formats)
	- [Semantic Code](#semantic-code)
	- [Comments](#comments)
	- [DocStrings](#docstrings)
	- [Markdown](#markdown)
	- [DBML](#dbml)
- [The Pragmatic Scribe Paradigm](#the-pragmatic-scribe-paradigm)
- [First Class Documentation](#first-class-documentation)
	- [Project Docs](#project-docs)
	- [Initiative Docs](#initiative-docs)
- [Conclusion](#conclusion)
- [See Also](#see-also)

Introduction
-------------------

In the ever-evolving landscape of software engineering, the role of documentation cannot be overstated. Documentation serves as the lifeblood of any software project, enabling developers to understand, maintain, and extend codebases effectively. In this comprehensive guide, we will explore the intricacies of creating high-quality documentation, catering to both novice and experienced software engineers.

A Note on Systems
---------------------------

Before delving into the specifics of documentation, it's crucial to understand the systems that documentation interacts with. Software development is not isolated; it's part of a larger ecosystem that includes various tools, technologies, and paradigms. We'll briefly touch upon these systems to provide context for the importance of documentation in this complex environment.

See [systems](systems.md)

Philosophy
----------------

See [philosophy](the-pragmatic-scribe/philosophy.md)

Formats
-----------

Documentation comes in various forms, each with its unique strengths. We'll explore formats such as semantic code, comments, docstrings, markdown, and DBML, discussing when and how to use them effectively.

### Semantic Code

Writing self-explanatory code can be a form of documentation in itself. We'll look at the principles of writing semantic code that tells a story without additional documentation.

### Comments

Comments serve as annotations to your code, providing context and explanations. We'll discuss when and how to use comments effectively, avoiding common pitfalls.

### DocStrings

In languages like Python, docstrings play a crucial role in documenting functions and classes. We'll explore the conventions for writing clear and informative docstrings.

### Markdown

Markdown is a versatile format for creating structured documents. We'll delve into its syntax and explore how it can be used for various types of documentation.

### DBML

Database schema documentation is a critical part of many projects. We'll discuss how DBML, a specialized language, can be used to document your database schema effectively.

The Pragmatic Scribe Paradigm
----------------------------------------------

See [paradigm](the-pragmatic-scribe/paradigm.md)

First Class Documentation
---------------------------------------

Documentation isn't a monolithic entity; it varies based on the context. We'll categorize documentation into different classes, each tailored to specific aspects of a project.

### Project Docs

Project-level documentation provides an overview and governance for the entire software project. We'll explore key documents like README, LICENSE, CHANGELOG, CONTRIBUTORS, and more.

See [project-docs](the-pragmatic-scribe/project-docs.md) for details.

But how do we document things that apply to multiple projects?

### Initiative Docs

See [initiative-docs](the-pragmatic-scribe/initiative-docs.md) for details.

Conclusion
----------------

> 如果你不改變方向，你可能會回到原來的方向。
> 
> *"If you do not change direction, you may end up where you were heading."*
> 
> *- Lao Tzu*

A pragmatic scribe will not likely need to apply every strategy covered here on a single project. But they have these tools at their disposal and know when best to apply each one.

The purpose of documentation is to transfer knowledge from your mind to those of others across time and space. Though tools and paradigms may change, the pragmatic philosophy remains to achieve that purpose, and the philosophy demands change when it's appropriate.

See Also
-------------

- [GitHub Repository Structure Best Practices](https://medium.com/code-factory-berlin/github-repository-structure-best-practices-248e6effc405)
- [DBML - Database Markup Language](https://dbml.dbdiagram.io/home/#dbml-database-markup-language)
- [Markdown Guide](https://www.markdownguide.org)

[^1]: *The Pragmatic Programmer* by Dave Thomas.
[^2]: [google/styleguide/docguide](https://github.com/google/styleguide/tree/gh-pages/docguide)
[^3]: [CODE IS NOT LITERATURE](https://gigamonkeys.com/code-reading/)
